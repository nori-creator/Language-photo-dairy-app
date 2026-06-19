import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store/AppStore';
import { Recall, blurAmount, isDue } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, PrimaryButton, Sticker } from '@/components';

const RECALLS: { key: Recall; label: string; tint: keyof ReturnType<typeof useColors> }[] = [
  { key: 'forgot', label: '忘れた', tint: 'red' },
  { key: 'hard', label: '難しい', tint: 'orange' },
  { key: 'good', label: 'できた', tint: 'blue' },
  { key: 'easy', label: '簡単', tint: 'green' },
];

export default function ReviewScreen() {
  const { cards, reviewCard } = useApp();
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);

  const due = useMemo(() => cards.filter((c) => isDue(c.srs)), [cards]);
  const current = due[0];

  if (!current) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.systemGroupedBackground }]}>
        <Ionicons name="checkmark-circle" size={56} color={colors.green} />
        <AppText variant="title3" style={{ marginTop: spacing.md }}>今日の復習は完了！</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.xs }}>
          また単語を撮って図鑑を増やそう
        </AppText>
      </View>
    );
  }

  const onRate = (r: Recall) => {
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
      <AppText variant="footnote" color={colors.secondaryLabel}>
        のこり {due.length} 枚 · まだ覚えてる？
      </AppText>

      <View style={[styles.card, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <Sticker emoji={current.sticker} size={150} blur={blur} />
        <AppText variant="largeTitle" style={{ marginTop: spacing.md }}>{current.word}</AppText>

        {current.srs.lapses >= 2 && (
          <AppText variant="caption1" color={colors.red} style={{ marginTop: spacing.xs }}>
            ⚠️ 何度も忘れています。写真が薄れてきました…
          </AppText>
        )}

        {revealed ? (
          <View style={styles.answer}>
            <AppText variant="title3" color={colors.secondaryLabel}>{current.reading}</AppText>
            <AppText variant="body" style={{ marginTop: spacing.sm, textAlign: 'center' }}>{current.meaning}</AppText>
            {current.examples[0] && (
              <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                {current.examples[0].text}
              </AppText>
            )}
          </View>
        ) : (
          <PrimaryButton title="答えを見る" onPress={() => setRevealed(true)} variant="tinted" style={{ marginTop: spacing.xl }} />
        )}
      </View>

      {revealed && (
        <View style={styles.ratings}>
          {RECALLS.map((r) => (
            <PrimaryButton
              key={r.key}
              title={r.label}
              onPress={() => onRate(r.key)}
              variant="tinted"
              style={[styles.rateBtn, { backgroundColor: (colors[r.tint] as string) + '22' }]}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  answer: { alignItems: 'center', marginTop: spacing.lg },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  rateBtn: { flexGrow: 1, flexBasis: '47%' },
});
