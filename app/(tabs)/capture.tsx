import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/store/AppStore';
import { services } from '@/services';
import { canCapture, remainingCaptures } from '@/lib/quota';
import { initialSrs } from '@/lib/srs';
import { uploadImage } from '@/lib/storage';
import { getCaptureLocation, type CaptureLocation } from '@/lib/location';
import { feedback } from '@/lib/feedback';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Icon, PrimaryButton, PressableScale, ScanOverlay, StickerRevealOverlay } from '@/components';
import { IdentifyCandidate, VocabCard } from '@/types';

type Phase = 'idle' | 'analyzing' | 'confirm' | 'revealing';
interface Reveal { photo: string; sticker: string; word: string; reading?: string }

export default function CaptureScreen() {
  const { profile, capturedToday, addCard, session } = useApp();
  const colors = useColors();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [candidates, setCandidates] = useState<IdentifyCandidate[]>([]);
  const [shotPhoto, setShotPhoto] = useState('');
  const [shotBase64, setShotBase64] = useState<string | undefined>(undefined);
  const [manual, setManual] = useState('');
  const [note, setNote] = useState('');
  const [reveal, setReveal] = useState<Reveal | null>(null);

  // Prefetched work so the post-confirm wait is hidden behind the reveal.
  const cutoutRef = useRef<Promise<{ sticker: string }> | null>(null);
  const photoUploadRef = useRef<Promise<string | null>>(Promise.resolve(null));
  const locationRef = useRef<Promise<CaptureLocation | null>>(Promise.resolve(null));
  const sourceRef = useRef<'object' | 'library' | 'ocr'>('object');

  const remaining = remainingCaptures(profile.plan, capturedToday);
  const allowed = canCapture(profile.plan, capturedToday);
  const hasCameraPermission = permission?.granted ?? false;
  const userId = session?.user.id;

  const immersive = phase === 'analyzing' || (phase === 'idle' && hasCameraPermission && allowed);
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !immersive });
  }, [immersive, navigation]);

  const quotaText = profile.plan === 'pro' ? 'Pro · 撮り放題' : `今日あと ${remaining} 枚`;

  /** Capture → kick off identify (foreground) + cutout & photo upload (background). */
  const shoot = async (photo: string, imageBase64?: string, source: 'object' | 'library' | 'ocr' = 'object') => {
    if (!allowed) return;
    feedback.capture();
    sourceRef.current = source;
    setShotPhoto(photo);
    setShotBase64(imageBase64);
    setPhase('analyzing');

    // Prefetch the slow bits now (independent of the chosen word).
    cutoutRef.current = services.cutout.cutout({ photo, imageBase64 }).catch(() => ({ sticker: photo }));
    photoUploadRef.current =
      userId && imageBase64 ? uploadImage(userId, imageBase64, 'photo', 'image/jpeg').catch(() => null) : Promise.resolve(null);
    // Record where this was captured (foreground, best-effort).
    locationRef.current = getCaptureLocation();

    try {
      const results = await services.identify.identify({
        photo,
        imageBase64,
        target: profile.targetLanguage,
        native: profile.nativeLanguage,
      });
      setCandidates(results);
      setPhase('confirm');
    } catch {
      setCandidates([]);
      setPhase('confirm');
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !allowed) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: true });
      if (pic?.uri) shoot(pic.uri, pic.base64);
    } catch {
      /* shutter failed — stay idle */
    }
  };

  const pickFromLibrary = async () => {
    if (!allowed) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]?.uri) {
      shoot(result.assets[0].uri, result.assets[0].base64 ?? undefined, 'library');
    }
  };

  /** Persist the card in the background; the reveal overlay masks the latency. */
  const buildCard = async (c: IdentifyCandidate, sticker: string, comment: string) => {
    const [fields, photoUrl, location] = await Promise.all([
      services.enrich.enrich({ word: c.word, target: profile.targetLanguage, native: profile.nativeLanguage }),
      photoUploadRef.current,
      locationRef.current,
    ]);
    let stickerUrl = sticker;
    if (userId) {
      try {
        stickerUrl = sticker.startsWith('data:')
          ? await uploadImage(userId, sticker, 'sticker', 'image/png')
          : photoUrl ?? sticker;
      } catch {
        stickerUrl = photoUrl ?? sticker;
      }
    }
    const card: VocabCard = {
      id: `c_${Date.now()}`,
      sticker: stickerUrl,
      photo: photoUrl ?? shotPhoto,
      targetLanguage: profile.targetLanguage,
      word: c.word,
      categoryId: c.categoryId,
      ...fields,
      reading: fields.reading || c.reading,
      audioUri: null,
      srs: initialSrs(),
      capturedAt: new Date().toISOString(),
      location: location ?? undefined,
      userComment: comment.trim() || null,
      source: sourceRef.current,
    };
    await addCard(card);
  };

  const confirm = async (c: IdentifyCandidate) => {
    feedback.tap();
    const comment = note;
    setNote('');
    // Show the reveal immediately (sticker upgrades to the cut-out when ready).
    setReveal({ photo: shotPhoto, sticker: shotPhoto, word: c.word, reading: c.reading });
    setPhase('revealing');
    const cut = await cutoutRef.current;
    const sticker = cut?.sticker ?? shotPhoto;
    if (sticker !== shotPhoto) setReveal((r) => (r ? { ...r, sticker } : r));
    buildCard(c, sticker, comment);
  };

  const confirmManual = () => {
    const word = manual.trim();
    if (!word) return;
    setManual('');
    confirm({ word, reading: '', nativeTranslation: '', emoji: '', categoryId: 'object', confidence: 1 });
  };

  const reset = () => {
    setPhase('idle');
    setCandidates([]);
    setNote('');
  };

  // ── Full-screen camera / scanner ─────────────────────────────────────────
  if (immersive) {
    return (
      <View style={styles.fsRoot}>
        {phase === 'analyzing' ? (
          <>
            <Image source={{ uri: shotPhoto }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <ScanOverlay height={screenH} />
          </>
        ) : (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        )}

        <View style={[styles.fsTop, { top: insets.top + spacing.sm }]} pointerEvents="none">
          <View style={styles.fsPill}>
            <Icon name="flash-outline" size={15} color="#FFD60A" />
            <AppText variant="footnote" color="#fff">{quotaText}</AppText>
          </View>
        </View>

        {phase === 'idle' && (
          <View style={[styles.fsControls, { paddingBottom: insets.bottom + spacing.xxl }]}>
            <PressableScale onPress={pickFromLibrary} style={styles.fsSide}>
              <Icon name="images-outline" size={26} color="#fff" />
            </PressableScale>
            <PressableScale onPress={takePhoto} haptic={false} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </PressableScale>
            <View style={styles.fsSide} />
          </View>
        )}
      </View>
    );
  }

  // ── Setup / confirm (scrollable) ─────────────────────────────────────────
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {/* Quota banner */}
      <View style={[styles.quota, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <Icon name="flash-outline" size={18} color={colors.orange} />
        <AppText variant="subhead" color={colors.secondaryLabel} style={{ flex: 1 }}>
          {profile.plan === 'pro' ? 'Pro · 撮り放題' : `今日あと ${remaining} 枚（無料プラン）`}
        </AppText>
        {profile.plan === 'free' && <AppText variant="subhead" color={colors.blue}>Proにする</AppText>}
      </View>

      {phase === 'idle' && !allowed && (
        <View style={[styles.limit, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
          <AppText variant="headline">今日の上限に達しました</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginVertical: spacing.sm }}>
            Proにアップグレードすると無制限に撮れます。
          </AppText>
          <PrimaryButton title="Proにアップグレード" onPress={() => {}} />
        </View>
      )}

      {phase === 'idle' && allowed && !hasCameraPermission && (
        <View style={[styles.limit, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
          <AppText variant="headline">カメラを使う準備</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginVertical: spacing.sm }}>
            被写体を撮ってカードにするために、カメラの使用を許可してください。
          </AppText>
          <PrimaryButton title="カメラを許可する" onPress={requestPermission} />
          <PrimaryButton title="ライブラリから選ぶ" onPress={pickFromLibrary} variant="plain" style={{ marginTop: spacing.sm }} />
        </View>
      )}

      {/* Confirm: captured photo + candidates */}
      {phase === 'confirm' && (
        <View>
          <Image source={{ uri: shotPhoto }} style={styles.preview} contentFit="cover" />
          <AppText variant="title3" style={{ marginBottom: spacing.xs }}>これで合ってる？</AppText>
          <AppText variant="subhead" color={colors.secondaryLabel} style={{ marginBottom: spacing.md }}>
            カードにする単語を選んでください
          </AppText>
          {candidates.map((c, i) => (
            <PressableScale
              key={`${c.word}-${i}`}
              onPress={() => confirm(c)}
              style={[styles.candidate, { backgroundColor: colors.secondarySystemGroupedBackground }]}
            >
              <View style={{ flex: 1 }}>
                <AppText variant="headline">
                  {c.word} <AppText variant="subhead" color={colors.secondaryLabel}>{c.reading}</AppText>
                </AppText>
                <AppText variant="footnote" color={colors.secondaryLabel}>{c.nativeTranslation || '（母語訳）'}</AppText>
              </View>
              <AppText variant="caption1" color={colors.tertiaryLabel}>{Math.round(c.confidence * 100)}%</AppText>
              <Icon name="chevron-forward" size={18} color={colors.tertiaryLabel} />
            </PressableScale>
          ))}

          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
            ひとことメモ（任意・あとで日記になります）
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="例：朝ごはんで見つけた"
            placeholderTextColor={colors.tertiaryLabel}
            style={[styles.input, { backgroundColor: colors.secondarySystemGroupedBackground, color: colors.label, marginBottom: spacing.sm }]}
          />

          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
            候補にない場合は手動入力
          </AppText>
          <View style={styles.manualRow}>
            <TextInput
              value={manual}
              onChangeText={setManual}
              placeholder="単語を入力"
              placeholderTextColor={colors.tertiaryLabel}
              style={[styles.input, { backgroundColor: colors.secondarySystemGroupedBackground, color: colors.label }]}
            />
            <PrimaryButton title="作成" onPress={confirmManual} variant="tinted" style={{ paddingHorizontal: spacing.lg }} />
          </View>
          <PrimaryButton title="撮り直す" onPress={reset} variant="plain" style={{ marginTop: spacing.md }} />
        </View>
      )}

      <StickerRevealOverlay
        visible={!!reveal}
        photo={reveal?.photo ?? ''}
        sticker={reveal?.sticker}
        word={reveal?.word ?? ''}
        reading={reveal?.reading}
        target={profile.targetLanguage}
        onDone={() => {
          setReveal(null);
          reset();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  quota: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  limit: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },

  // Full-screen camera / scanner
  fsRoot: { flex: 1, backgroundColor: '#000' },
  fsTop: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  fsPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: 999,
  },
  fsControls: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl,
  },
  fsSide: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },

  // Confirm
  preview: { width: '100%', height: 200, borderRadius: radius.lg, marginBottom: spacing.lg, backgroundColor: '#000' },
  candidate: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, minHeight: 44,
  },
  manualRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 },
});
