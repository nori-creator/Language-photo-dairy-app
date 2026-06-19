import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { categoryById } from '@/data/categories';
import { categoryIcon } from '@/lib/categoryIcon';
import { blurAmount } from '@/lib/srs';
import { radius, shadow, spacing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText, Card, Icon, PressableScale, SectionHeader, Sticker } from '@/components';
import { VocabCard } from '@/types';

export default function DiaryScreen() {
  const { diary, cards, profile } = useApp();
  const colors = useColors();
  const router = useRouter();
  const reduced = useReducedMotion();
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {/* Streak */}
      <Card style={styles.streak}>
        <Icon name="flame" size={26} color={colors.label} />
        <View style={{ flex: 1 }}>
          <AppText variant="title2">{profile.streak}日連続</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel}>毎日1枚撮ってストリークを伸ばそう</AppText>
        </View>
      </Card>

      {diary.length === 0 && (
        <View style={styles.empty}>
          <Icon name="camera-outline" size={48} color={colors.tertiaryLabel} />
          <AppText variant="headline" color={colors.secondaryLabel} style={{ marginTop: spacing.md }}>
            まだ記録がありません
          </AppText>
          <AppText variant="footnote" color={colors.tertiaryLabel} style={{ marginTop: spacing.xs }}>
            「撮る」から最初の一枚を集めよう
          </AppText>
        </View>
      )}

      {diary.map((entry, idx) => {
        const dayCards = entry.cardIds.map((id) => cardById.get(id)).filter(Boolean) as VocabCard[];
        return (
          <Animated.View
            key={entry.date}
            entering={reduced ? undefined : FadeInDown.delay(idx * 60).duration(380)}
          >
            <SectionHeader title={formatDate(entry.date)} accessory={`${dayCards.length}枚`} />
            <View style={styles.grid}>
              {dayCards.map((c) => (
                <PressableScale key={c.id} onPress={() => router.push(`/card/${c.id}`)} style={styles.tile}>
                  <View style={[styles.photo, { backgroundColor: colors.secondarySystemGroupedBackground }, shadow.card]}>
                    <Sticker emoji={c.sticker} size={92} blur={blurAmount(c.srs)} />
                  </View>
                  <AppText variant="subhead" numberOfLines={1} style={styles.word}>{c.word}</AppText>
                  <View style={styles.cat}>
                    <Icon name={categoryIcon(c.categoryId)} size={11} color={colors.tertiaryLabel} />
                    <AppText variant="caption2" color={colors.tertiaryLabel} numberOfLines={1}>
                      {categoryById(c.categoryId)?.name}
                    </AppText>
                  </View>
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        );
      })}

      {diary.length > 0 && (
        <View style={styles.footerHint}>
          <Icon name="share-outline" size={15} color={colors.tertiaryLabel} />
          <AppText variant="footnote" color={colors.tertiaryLabel}>1日の日記は将来、友達と共有できます</AppText>
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(key: string): string {
  const d = new Date(key + 'T00:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const label = `${d.getMonth() + 1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`;
  return key === today ? `今日 · ${label}` : label;
}

const TILE = 104;
const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { width: TILE, gap: spacing.xs },
  photo: { width: TILE, height: TILE, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  word: { marginTop: 2 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
});
