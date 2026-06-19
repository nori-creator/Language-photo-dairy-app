import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store/AppStore';
import { services } from '@/services';
import { canCapture, remainingCaptures } from '@/lib/quota';
import { initialSrs } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, GotchaOverlay, PrimaryButton, Sticker } from '@/components';
import { IdentifyCandidate, VocabCard } from '@/types';

type Phase = 'idle' | 'analyzing' | 'confirm' | 'building';

/** Mock "viewfinder" subjects (no physical camera in this environment). */
const SUBJECTS = ['🍎', '🐶', '☕', '🚏'];

export default function CaptureScreen() {
  const { profile, capturedToday, addCard } = useApp();
  const colors = useColors();

  const [phase, setPhase] = useState<Phase>('idle');
  const [candidates, setCandidates] = useState<IdentifyCandidate[]>([]);
  const [shotEmoji, setShotEmoji] = useState('🍎');
  const [manual, setManual] = useState('');
  const [gotcha, setGotcha] = useState<{ emoji: string; word: string } | null>(null);

  const remaining = remainingCaptures(profile.plan, capturedToday);
  const allowed = canCapture(profile.plan, capturedToday);

  const shoot = async (emoji: string) => {
    if (!allowed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShotEmoji(emoji);
    setPhase('analyzing');
    const results = await services.identify.identify({
      photo: emoji,
      target: profile.targetLanguage,
      native: profile.nativeLanguage,
    });
    setCandidates(results);
    setPhase('confirm');
  };

  const confirm = async (c: IdentifyCandidate) => {
    setPhase('building');
    const [{ sticker }, fields] = await Promise.all([
      services.cutout.cutout({ photo: shotEmoji }),
      services.enrich.enrich({ word: c.word, target: profile.targetLanguage, native: profile.nativeLanguage }),
    ]);
    const card: VocabCard = {
      id: `c_${Date.now()}`,
      sticker,
      photo: shotEmoji,
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
    setGotcha({ emoji: sticker, word: c.word });
    reset();
  };

  const confirmManual = () => {
    const word = manual.trim();
    if (!word) return;
    confirm({ word, reading: '', nativeTranslation: '', emoji: shotEmoji, categoryId: 'object', confidence: 1 });
    setManual('');
  };

  const reset = () => {
    setPhase('idle');
    setCandidates([]);
  };

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
          <View style={styles.center}>
            <Sticker emoji={shotEmoji} size={120} />
            <ActivityIndicator color="#fff" style={{ marginTop: spacing.lg }} />
            <AppText variant="subhead" color="#fff" style={{ marginTop: spacing.sm }}>
              AIが分析中…
            </AppText>
          </View>
        ) : phase === 'building' ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
            <AppText variant="subhead" color="#fff" style={{ marginTop: spacing.sm }}>
              カードを作成中…
            </AppText>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="scan-outline" size={64} color="rgba(255,255,255,0.5)" />
            <AppText variant="footnote" color="rgba(255,255,255,0.7)" style={{ marginTop: spacing.md }}>
              撮りたい被写体をタップ（デモ用）
            </AppText>
          </View>
        )}
      </View>

      {/* Idle: subject chooser + shutter */}
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
          {allowed && (
            <View style={styles.subjects}>
              {SUBJECTS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => shoot(e)}
                  style={[styles.subject, { backgroundColor: colors.secondarySystemGroupedBackground }]}
                >
                  <AppText style={{ fontSize: 34 }}>{e}</AppText>
                </Pressable>
              ))}
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
        emoji={gotcha?.emoji ?? '🍎'}
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
  subjects: { flexDirection: 'row', justifyContent: 'space-between' },
  subject: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  limit: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  confirm: {},
  candidate: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm,
  },
  manualRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 },
});
