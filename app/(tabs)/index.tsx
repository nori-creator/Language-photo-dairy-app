import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store/AppStore';
import { categoryById } from '@/data/categories';
import { blurAmount } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Sticker } from '@/components';
import { VocabCard } from '@/types';

export default function DiaryScreen() {
  const { diary, cards, profile } = useApp();
  const colors = useColors();
  const router = useRouter();
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {/* Streak banner */}
      <View style={[styles.streak, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <AppText style={{ fontSize: 30 }}>🔥</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="title2">{profile.streak}日連続</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            毎日1枚撮ってストリークを伸ばそう
          </AppText>
        </View>
      </View>

      {diary.map((entry) => {
        const dayCards = entry.cardIds.map((id) => cardById.get(id)).filter(Boolean) as VocabCard[];
        return (
          <View key={entry.date} style={[styles.page, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <View style={styles.pageHeader}>
              <AppText variant="title3">{formatDate(entry.date)}</AppText>
              <AppText variant="footnote" color={colors.secondaryLabel}>{dayCards.length}枚</AppText>
            </View>
            <View style={styles.scrap}>
              {dayCards.map((c, i) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/card/${c.id}`)}
                  style={[styles.polaroid, { backgroundColor: colors.systemBackground, transform: [{ rotate: `${tilt(i)}deg` }] }]}
                >
                  <Sticker emoji={c.sticker} size={64} blur={blurAmount(c.srs)} />
                  <AppText variant="subhead">{c.word}</AppText>
                  <AppText variant="caption2" color={colors.secondaryLabel}>
                    {categoryById(c.categoryId)?.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.footerHint}>
        <Ionicons name="share-outline" size={16} color={colors.secondaryLabel} />
        <AppText variant="footnote" color={colors.secondaryLabel}>
          1日の日記は将来、友達と共有できます
        </AppText>
      </View>
    </ScrollView>
  );
}

const tilt = (i: number) => [-3, 2, -1.5, 3, -2.5][i % 5];

function formatDate(key: string): string {
  const d = new Date(key + 'T00:00:00');
  const today = new Date();
  const isToday = key === today.toISOString().slice(0, 10);
  const label = `${d.getMonth() + 1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`;
  return isToday ? `今日 · ${label}` : label;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.lg,
  },
  page: { borderRadius: radius.lg, padding: spacing.lg },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  scrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  polaroid: {
    width: 104, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, gap: 2,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  footerHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
});
