import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAudioRecorder, AudioModule, IOSOutputFormat, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '@/store/AppStore';
import { blurAmount, isDue } from '@/lib/srs';
import { feedback } from '@/lib/feedback';
import { scorePronunciation, fetchDistractors, pronThreshold } from '@/lib/ai';
import { services } from '@/services';
import { radius, spacing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText, Card, CutoutSticker, Icon, PressableScale, PrimaryButton } from '@/components';

// 16 kHz mono WAV — the format Azure's pronunciation REST API expects.
const REC_OPTIONS = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  android: { outputFormat: 'default', audioEncoder: 'default' },
  ios: { outputFormat: IOSOutputFormat.LINEARPCM, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
} as any;

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function ReviewScreen() {
  const { cards, reviewCard, profile } = useApp();
  const colors = useColors();
  const reduced = useReducedMotion();
  const recorder = useAudioRecorder(REC_OPTIONS);

  const due = useMemo(() => cards.filter((c) => isDue(c.srs)), [cards]);
  const current = due[0];

  const [step, setStep] = useState<'speak' | 'quiz'>('speak');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  // Reset the repair flow whenever the card changes.
  useEffect(() => {
    setStep('speak');
    setScore(null);
    setOptions([]);
    setPicked(null);
  }, [current?.id]);

  if (!current) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.systemGroupedBackground }]}>
        <Icon name="checkmark-circle" size={56} color={colors.green} />
        <AppText variant="title3" style={{ marginTop: spacing.md }}>今日の復習は完了！</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.xs }}>
          また単語を撮って図鑑を増やそう
        </AppText>
      </View>
    );
  }

  const threshold = pronThreshold(profile.pronStrictness);
  const passedSpeak = score != null && score >= threshold;

  const hear = () => {
    feedback.tap();
    services.tts.speak({ text: current.word, target: current.targetLanguage }).catch(() => {});
  };

  const record = async () => {
    try {
      if (recording) {
        // Stop → score.
        setRecording(false);
        setBusy(true);
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error('no audio');
        const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const result = await scorePronunciation(audioBase64, current.word);
        setScore(Math.round(result.pron));
        if (result.pron >= threshold) feedback.success();
        else feedback.tap();
      } else {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) return;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        feedback.tap();
        setRecording(true);
        setScore(null);
      }
    } catch {
      setScore(-1); // signal "couldn't score"
    } finally {
      setBusy(false);
    }
  };

  const goQuiz = async () => {
    feedback.tap();
    setBusy(true);
    try {
      const distractors = await fetchDistractors(current.word, current.meaning, current.categoryId);
      const opts = shuffle([current.meaning, ...distractors.filter((d) => d && d !== current.meaning)].slice(0, 4));
      setOptions(opts.length >= 2 ? opts : [current.meaning]);
    } catch {
      setOptions([current.meaning]);
    } finally {
      setBusy(false);
      setStep('quiz');
    }
  };

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === current.meaning) {
      feedback.success();
      setTimeout(() => reviewCard(current.id, 'good'), 700); // repaired → un-blur
    } else {
      feedback.tap();
    }
  };

  const giveUp = () => {
    feedback.tap();
    reviewCard(current.id, 'forgot');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      <AppText variant="subhead" color={colors.secondaryLabel}>のこり {due.length} 枚 · 発音して意味を当てよう</AppText>

      <Card style={styles.card}>
        <View style={[styles.platform, { backgroundColor: colors.fill }]}>
          <CutoutSticker uri={current.sticker} size={150} blur={blurAmount(current.srs)} />
        </View>
        <View style={styles.wordRow}>
          <AppText variant="largeTitle" style={{ fontWeight: '800' }}>{current.word}</AppText>
          <PressableScale onPress={hear} haptic={false} style={[styles.hear, { backgroundColor: colors.blue }]}>
            <Icon name="volume-high" size={20} color="#fff" />
          </PressableScale>
        </View>
        {!!current.reading && <AppText variant="title3" color={colors.blue}>{current.reading}</AppText>}
      </Card>

      {step === 'speak' ? (
        <Card>
          <AppText variant="footnote" color={colors.secondaryLabel} style={styles.label}>① 発音する</AppText>
          <View style={styles.center}>
            <PressableScale
              onPress={record}
              haptic={false}
              disabled={busy && !recording}
              style={[styles.mic, { backgroundColor: recording ? colors.red : colors.blue, shadowColor: recording ? colors.red : colors.blue }]}
            >
              {busy && !recording ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Icon name={recording ? 'stop' : 'mic'} size={30} color="#fff" />
              )}
            </PressableScale>
            <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.sm }}>
              {recording ? 'タップで停止' : busy ? '採点中…' : 'タップして録音'}
            </AppText>

            {score != null && score >= 0 && (
              <Animated.View entering={reduced ? undefined : FadeIn} style={styles.scoreRow}>
                <Icon name={passedSpeak ? 'checkmark-circle' : 'refresh'} size={18} color={passedSpeak ? colors.green : colors.orange} />
                <AppText variant="headline" color={passedSpeak ? colors.green : colors.orange}>
                  発音スコア {score}（合格 {threshold}）
                </AppText>
              </Animated.View>
            )}
            {score === -1 && (
              <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                うまく聞き取れませんでした。もう一度試すか、先に進めます。
              </AppText>
            )}
          </View>

          <PrimaryButton
            title="意味の確認へ"
            onPress={goQuiz}
            variant={passedSpeak ? 'filled' : 'tinted'}
            style={{ marginTop: spacing.lg }}
          />
          <PrimaryButton title="わからない" onPress={giveUp} variant="plain" style={{ marginTop: spacing.xs }} />
        </Card>
      ) : (
        <Card>
          <AppText variant="footnote" color={colors.secondaryLabel} style={styles.label}>② 意味はどれ？</AppText>
          {options.map((opt) => {
            const isCorrect = opt === current.meaning;
            const chosen = picked === opt;
            const showState = picked != null && (chosen || isCorrect);
            const tint = !showState ? colors.secondarySystemGroupedBackground : isCorrect ? colors.green + '22' : colors.red + '22';
            const fg = !showState ? colors.label : isCorrect ? colors.green : colors.red;
            return (
              <PressableScale key={opt} onPress={() => pick(opt)} haptic={false} style={[styles.option, { backgroundColor: tint }]}>
                <AppText variant="body" color={fg} style={{ flex: 1 }}>{opt}</AppText>
                {showState && <Icon name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={20} color={fg} />}
              </PressableScale>
            );
          })}
          {picked != null && picked !== current.meaning && (
            <PrimaryButton title="もう一度" onPress={() => { setPicked(null); }} variant="tinted" style={{ marginTop: spacing.md }} />
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { alignItems: 'center', paddingVertical: spacing.xl },
  platform: { width: 180, height: 180, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  hear: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { marginBottom: spacing.md, fontWeight: '700' },
  center: { alignItems: 'center' },
  mic: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.sm },
});
