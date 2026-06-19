import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { CATEGORIES } from '@/data/categories';
import { blurAmount } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Sticker } from '@/components';
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
      <AppText variant="footnote" color={colors.secondaryLabel} style={styles.summary}>
        コレクション {total} / {goal} 種
      </AppText>

      {CATEGORIES.map((cat) => {
        const owned = byCategory.get(cat.id) ?? [];
        const ownedWords = new Set(owned.map((c) => c.word));
        const locked = (cat.targetWords ?? []).filter((w) => !ownedWords.has(w));
        return (
          <View key={cat.id} style={[styles.section, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <View style={styles.sectionHeader}>
              <AppText variant="title3">{cat.emoji}  {cat.name}</AppText>
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {owned.length}/{(cat.targetWords?.length ?? owned.length)}
              </AppText>
            </View>
            <View style={styles.grid}>
              {owned.map((c) => (
                <Pressable key={c.id} onPress={() => router.push(`/card/${c.id}`)} style={styles.slot}>
                  <View style={[styles.slotInner, { backgroundColor: colors.tertiarySystemBackground }]}>
                    <Sticker emoji={c.sticker} size={48} blur={blurAmount(c.srs)} />
                  </View>
                  <AppText variant="caption2" numberOfLines={1}>{c.word}</AppText>
                </Pressable>
              ))}
              {locked.map((w) => (
                <View key={w} style={styles.slot}>
                  <View style={[styles.slotInner, styles.locked, { borderColor: colors.separator }]}>
                    <AppText variant="title2" color={colors.quaternaryLabel}>?</AppText>
                  </View>
                  <AppText variant="caption2" color={colors.tertiaryLabel} numberOfLines={1}>未取得</AppText>
                </View>
              ))}
            </View>
            {locked.length > 0 && (
              <AppText variant="caption1" color={colors.blue} style={styles.nudge}>
                外に出て「？」の単語を撮って集めよう
              </AppText>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  summary: { marginLeft: spacing.xs },
  section: { borderRadius: radius.lg, padding: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  slot: { width: 64, alignItems: 'center', gap: spacing.xs },
  slotInner: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  locked: { borderWidth: StyleSheet.hairlineWidth * 3, borderStyle: 'dashed', backgroundColor: 'transparent' },
  nudge: { marginTop: spacing.md },
});
