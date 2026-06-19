import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store/AppStore';
import { services } from '@/services';
import { canCapture, remainingCaptures } from '@/lib/quota';
import { initialSrs } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, GotchaOverlay, PrimaryButton, ScanOverlay, Sticker } from '@/components';
import { IdentifyCandidate, VocabCard } from '@/types';

type Phase = 'idle' | 'analyzing' | 'confirm' | 'building';

export default function CaptureScreen() {
  const { profile, capturedToday, addCard } = useApp();
  const colors = useColors();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [candidates, setCandidates] = useState<IdentifyCandidate[]>([]);
  const [shotPhoto, setShotPhoto] = useState('🍎');
  const [shotBase64, setShotBase64] = useState<string | undefined>(undefined);
  const [manual, setManual] = useState('');
  const [gotcha, setGotcha] = useState<{ sticker: string; word: string } | null>(null);

  const remaining = remainingCaptures(profile.plan, capturedToday);
  const allowed = canCapture(profile.plan, capturedToday);

  /** Kick off the analyze → confirm pipeline for a captured photo. */
  const shoot = async (photo: string, imageBase64?: string) => {
    if (!allowed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShotPhoto(photo);
    setShotBase64(imageBase64);
    setPhase('analyzing');
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
      // Identify failed (e.g. network/key issue) — fall back to manual entry.
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      shoot(result.assets[0].uri, result.assets[0].base64 ?? undefined);
    }
  };

  const confirm = async (c: IdentifyCandidate) => {
    setPhase('building');
    const [{ sticker }, fields] = await Promise.all([
      services.cutout.cutout({ photo: shotPhoto, imageBase64: shotBase64 }),
      services.enrich.enrich({ word: c.word, target: profile.targetLanguage, native: profile.nativeLanguage }),
    ]);
    const card: VocabCard = {
      id: `c_${Date.now()}`,
      sticker,
      photo: shotPhoto,
      targetLanguage: profile.targetLanguage,
      word: c.word,
      categoryId: c.categoryId,
      ...fields,
      reading: fields.reading || c.reading,
      audioUri: null,
      srs: initialSrs(),
      capturedAt: new Date().toISOString(),
    };
    addCard(card);
    setGotcha({ sticker, word: c.word });
    reset();
  };

  const confirmManual = () => {
    const word = manual.trim();
    if (!word) return;
    confirm({ word, reading: '', nativeTranslation: '', emoji: shotPhoto, categoryId: 'object', confidence: 1 });
    setManual('');
  };

  const reset = () => {
    setPhase('idle');
    setCandidates([]);
  };

  const hasCameraPermission = permission?.granted ?? false;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {/* Quota banner */}
      <View style={[styles.quota, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <Ionicons name="flash-outline" size={18} color={colors.orange} />
        <AppText variant="subhead" color={colors.secondaryLabel} style={{ flex: 1 }}>
          {profile.plan === 'pro' ? 'Pro · 撮り放題' : `今日あと ${remaining} 枚（無料プラン）`}
        </AppText>
        {profile.plan === 'free' && (
          <AppText variant="subhead" color={colors.blue}>Proにする</AppText>
        )}
      </View>

      {/* Viewfinder */}
      <View style={[styles.viewfinder, { backgroundColor: '#000' }]}>
        {phase === 'analyzing' ? (
          <View style={styles.fill}>
            <Sticker emoji={shotPhoto} size={280} />
            <ScanOverlay height={280} />
          </View>
        ) : phase === 'building' ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
            <AppText variant="subhead" color="#fff" style={{ marginTop: spacing.sm }}>
              カードを作成中…
            </AppText>
          </View>
        ) : phase === 'idle' && hasCameraPermission && allowed ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.center}>
            <Ionicons name="scan-outline" size={64} color="rgba(255,255,255,0.5)" />
            <AppText variant="footnote" color="rgba(255,255,255,0.7)" style={{ marginTop: spacing.md }}>
              {allowed ? 'カメラの準備中…' : '今日の上限に達しました'}
            </AppText>
          </View>
        )}
      </View>

      {/* Idle controls */}
      {phase === 'idle' && (
        <>
          {!allowed && (
            <View style={[styles.limit, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
              <AppText variant="headline">今日の上限に達しました</AppText>
              <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginVertical: spacing.sm }}>
                Proにアップグレードすると無制限に撮れます。
              </AppText>
              <PrimaryButton title="Proにアップグレード" onPress={() => {}} />
            </View>
          )}

          {allowed && !hasCameraPermission && (
            <View style={[styles.limit, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
              <AppText variant="headline">カメラを使う準備</AppText>
              <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginVertical: spacing.sm }}>
                被写体を撮ってカードにするために、カメラの使用を許可してください。
              </AppText>
              <PrimaryButton title="カメラを許可する" onPress={requestPermission} />
              <PrimaryButton
                title="ライブラリから選ぶ"
                onPress={pickFromLibrary}
                variant="plain"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}

          {allowed && hasCameraPermission && (
            <View style={styles.shutterRow}>
              <Pressable
                onPress={pickFromLibrary}
                style={[styles.sideButton, { backgroundColor: colors.secondarySystemGroupedBackground }]}
              >
                <Ionicons name="images-outline" size={24} color={colors.label} />
              </Pressable>

              <Pressable onPress={takePhoto} style={[styles.shutterOuter, { borderColor: colors.label }]}>
                <View style={[styles.shutterInner, { backgroundColor: colors.label }]} />
              </Pressable>

              {/* Spacer to keep the shutter centered */}
              <View style={styles.sideButton} />
            </View>
          )}
        </>
      )}

      {/* Confirm: candidates with native translation */}
      {phase === 'confirm' && (
        <View style={styles.confirm}>
          <AppText variant="headline" style={{ marginBottom: spacing.xs }}>これで合ってる？</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginBottom: spacing.md }}>
            カードにする単語を選んでください
          </AppText>
          {candidates.map((c, i) => (
            <Pressable
              key={`${c.word}-${i}`}
              onPress={() => confirm(c)}
              style={[styles.candidate, { backgroundColor: colors.secondarySystemGroupedBackground }]}
            >
              <AppText style={{ fontSize: 30 }}>{c.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{c.word} <AppText variant="subhead" color={colors.secondaryLabel}>{c.reading}</AppText></AppText>
                <AppText variant="footnote" color={colors.secondaryLabel}>{c.nativeTranslation || '（母語訳）'}</AppText>
              </View>
              <AppText variant="caption1" color={colors.tertiaryLabel}>{Math.round(c.confidence * 100)}%</AppText>
            </Pressable>
          ))}

          {/* Manual fallback */}
          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
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

      <GotchaOverlay
        visible={!!gotcha}
        emoji={gotcha?.sticker ?? '🍎'}
        word={gotcha?.word ?? ''}
        onDone={() => setGotcha(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  quota: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  viewfinder: { height: 280, borderRadius: radius.lg, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  limit: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl },
  sideButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30 },
  confirm: {},
  candidate: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm,
  },
  manualRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 },
});
