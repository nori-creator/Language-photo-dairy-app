import { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { CATEGORIES } from '@/data/categories';
import { categoryIcon } from '@/lib/categoryIcon';
import { blurAmount } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Card, Icon, PressableScale, ProgressBar, Sticker } from '@/components';
import { VocabCard } from '@/types';

export default function DexScreen() {
  const { cards } = useApp();
  const colors = useColors();
  const router = useRouter();

  const byCategory = useMemo(() => {
    const map = new Map<string, VocabCard[]>();
    for (const c of cards) map.set(c.categoryId, [...(map.get(c.categoryId) ?? []), c]);
    return map;
  }, [cards]);

  const total = cards.length;
  const goal = CATEGORIES.reduce((n, c) => n + (c.targetWords?.length ?? 0), 0);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {/* Collection summary */}
      <Card>
        <View style={styles.summaryRow}>
          <AppText variant="headline">コレクション</AppText>
          <AppText variant="subhead" color={colors.secondaryLabel}>{total} / {goal} 種</AppText>
        </View>
        <ProgressBar progress={goal ? total / goal : 0} style={{ marginTop: spacing.md }} />
      </Card>

      {CATEGORIES.map((cat) => {
        const owned = byCategory.get(cat.id) ?? [];
        const ownedWords = new Set(owned.map((c) => c.word));
        const locked = (cat.targetWords ?? []).filter((w) => !ownedWords.has(w));
        const count = cat.targetWords?.length ?? owned.length;
        return (
          <Card key={cat.id}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerLeft}>
                <Icon name={categoryIcon(cat.id)} size={20} color={colors.label} />
                <AppText variant="title3">{cat.name}</AppText>
              </View>
              <AppText variant="subhead" color={colors.secondaryLabel}>{owned.length}/{count}</AppText>
            </View>
            <View style={styles.grid}>
              {owned.map((c) => (
                <PressableScale key={c.id} onPress={() => router.push(`/card/${c.id}`)} style={styles.slot}>
                  <View style={[styles.slotInner, { backgroundColor: colors.tertiarySystemBackground }]}>
                    <Sticker emoji={c.sticker} size={56} blur={blurAmount(c.srs)} />
                  </View>
                  <AppText variant="caption2" numberOfLines={1}>{c.word}</AppText>
                </PressableScale>
              ))}
              {locked.map((w) => (
                <View key={w} style={styles.slot}>
                  <View style={[styles.slotInner, { backgroundColor: colors.fill }]}>
                    <Icon name="help" size={22} color={colors.quaternaryLabel} />
                  </View>
                  <AppText variant="caption2" color={colors.tertiaryLabel} numberOfLines={1}>未取得</AppText>
                </View>
              ))}
            </View>
            {locked.length > 0 && (
              <View style={styles.nudge}>
                <Icon name="sparkles-outline" size={14} color={colors.blue} />
                <AppText variant="caption1" color={colors.blue}>外に出て「？」の単語を撮って集めよう</AppText>
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  slot: { width: 68, alignItems: 'center', gap: spacing.xs },
  slotInner: { width: 68, height: 68, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
});
