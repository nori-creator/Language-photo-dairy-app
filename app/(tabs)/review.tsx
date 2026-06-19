import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '@/store/AppStore';
import { Recall, blurAmount, isDue } from '@/lib/srs';
import { feedback } from '@/lib/feedback';
import { radius, spacing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText, Card, Icon, PressableScale, PrimaryButton, Sticker } from '@/components';

const RECALLS: { key: Recall; label: string; tint: keyof ReturnType<typeof useColors> }[] = [
  { key: 'forgot', label: '忘れた', tint: 'red' },
  { key: 'hard', label: '難しい', tint: 'orange' },
  { key: 'good', label: 'できた', tint: 'blue' },
  { key: 'easy', label: '簡単', tint: 'green' },
];

export default function ReviewScreen() {
  const { cards, reviewCard } = useApp();
  const colors = useColors();
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  const due = useMemo(() => cards.filter((c) => isDue(c.srs)), [cards]);
  const current = due[0];

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

  const reveal = () => {
    feedback.tap();
    setRevealed(true);
  };
  const onRate = (r: Recall) => {
    if (r === 'good' || r === 'easy') feedback.success();
    else feedback.tap();
    reviewCard(current.id, r);
    setRevealed(false);
  };

  const blur = blurAmount(current.srs);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      <AppText variant="subhead" color={colors.secondaryLabel}>のこり {due.length} 枚 · まだ覚えてる？</AppText>

      <Card style={styles.card}>
        <View style={[styles.platform, { backgroundColor: colors.fill }]}>
          <Sticker emoji={current.sticker} size={150} blur={blur} />
        </View>
        <AppText variant="largeTitle" style={{ marginTop: spacing.lg }}>{current.word}</AppText>

        {current.srs.lapses >= 2 && (
          <View style={styles.warn}>
            <Icon name="alert-circle" size={14} color={colors.red} />
            <AppText variant="caption1" color={colors.red}>何度も忘れています。写真が薄れてきました</AppText>
          </View>
        )}

        {revealed ? (
          <Animated.View entering={reduced ? undefined : FadeIn.duration(260)} style={styles.answer}>
            <AppText variant="title3" color={colors.secondaryLabel}>{current.reading}</AppText>
            <AppText variant="body" style={{ marginTop: spacing.sm, textAlign: 'center' }}>{current.meaning}</AppText>
            {current.examples[0] && (
              <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                {current.examples[0].text}
              </AppText>
            )}
          </Animated.View>
        ) : (
          <PrimaryButton title="答えを見る" onPress={reveal} variant="tinted" style={{ marginTop: spacing.xl }} />
        )}
      </Card>

      {revealed && (
        <Animated.View entering={reduced ? undefined : FadeIn.duration(260)} style={styles.ratings}>
          {RECALLS.map((r) => {
            const tint = colors[r.tint] as string;
            return (
              <PressableScale
                key={r.key}
                onPress={() => onRate(r.key)}
                haptic={false}
                style={[styles.rateBtn, { backgroundColor: tint + '1F' }]}
              >
                <AppText variant="headline" color={tint}>{r.label}</AppText>
              </PressableScale>
            );
          })}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { alignItems: 'center', paddingVertical: spacing.xl },
  platform: { width: 180, height: 180, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  answer: { alignItems: 'center', marginTop: spacing.lg },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  rateBtn: { flexGrow: 1, flexBasis: '47%', minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
