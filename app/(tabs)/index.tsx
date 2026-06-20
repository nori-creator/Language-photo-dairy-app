import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { blurAmount } from '@/lib/srs';
import { radius, shadow, spacing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText, Icon, PressableScale, Sticker } from '@/components';
import { VocabCard } from '@/types';

// Warm "real paper" album page — kept constant across light/dark.
const PAPER = '#F6F3EC';
const INK = '#2B2B2E';
const ANGLES = [-5, 4, -3, 6, -4, 3, -6, 2, 5, -2];

/** Bigger cut-outs when there are fewer, so each day's page stays full. */
function itemSize(n: number): number {
  if (n <= 1) return 230;
  if (n === 2) return 188;
  if (n === 3) return 158;
  if (n === 4) return 146;
  if (n <= 6) return 130;
  return 112;
}

/**
 * Home = a daily photo album. Each day is an Instagram-style post: a white
 * paper page that fills the screen, with the day's cut-outs "pasted" as a
 * centered collage. Swipe between days.
 */
export default function DiaryScreen() {
  const { diary, cards, profile } = useApp();
  const colors = useColors();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const boardH = Math.round(height * 0.6);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.streak}>
        <Icon name="flame" size={16} color={colors.label} />
        <AppText variant="subhead">{profile.streak}日連続</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel}>· 毎日1枚で記録を伸ばそう</AppText>
      </View>

      {diary.length === 0 && (
        <View style={styles.empty}>
          <Icon name="images-outline" size={48} color={colors.tertiaryLabel} />
          <AppText variant="headline" color={colors.secondaryLabel} style={{ marginTop: spacing.md }}>
            アルバムはまだ空っぽ
          </AppText>
          <AppText variant="footnote" color={colors.tertiaryLabel} style={{ marginTop: spacing.xs }}>
            「撮る」で今日のページに写真を貼っていこう
          </AppText>
        </View>
      )}

      {diary.map((entry, idx) => {
        const dayCards = entry.cardIds.map((id) => cardById.get(id)).filter(Boolean) as VocabCard[];
        const size = itemSize(dayCards.length);
        return (
          <Animated.View
            key={entry.date}
            entering={reduced ? undefined : FadeIn.delay(idx * 50).duration(360)}
            style={styles.post}
          >
            <View style={styles.caption}>
              <AppText variant="headline">{formatDate(entry.date)}</AppText>
              <AppText variant="footnote" color={colors.secondaryLabel}>{dayCards.length}枚</AppText>
            </View>

            <View style={[styles.board, { minHeight: boardH }, shadow.card]}>
              <View style={styles.collage}>
                {dayCards.map((c, i) => (
                  <PressableScale
                    key={c.id}
                    onPress={() => router.push(`/card/${c.id}`)}
                    style={{ transform: [{ rotate: `${ANGLES[i % ANGLES.length]}deg` }] }}
                  >
                    <View style={[styles.pasted, shadow.popover]}>
                      <View style={[styles.photo, { width: size, height: size }]}>
                        <Sticker emoji={c.sticker} size={size} blur={blurAmount(c.srs)} />
                      </View>
                      <AppText variant="caption1" color={INK} numberOfLines={1} style={{ maxWidth: size }}>
                        {c.word}
                      </AppText>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function formatDate(key: string): string {
  const d = new Date(key + 'T00:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const label = `${d.getMonth() + 1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`;
  return key === today ? `今日 · ${label}` : label;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  post: { gap: spacing.sm },
  caption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  board: {
    backgroundColor: PAPER,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: spacing.xl,
  },
  pasted: { backgroundColor: '#FFFFFF', padding: spacing.xs, paddingBottom: spacing.sm, borderRadius: 6, alignItems: 'center' },
  photo: { borderRadius: 3, overflow: 'hidden', backgroundColor: '#ECECEC', marginBottom: 4 },
});
