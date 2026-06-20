import { useMemo } from 'react';
import { ImageBackground, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { blurAmount } from '@/lib/srs';
import { radius, shadow, spacing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText, CutoutSticker, Icon, PressableScale } from '@/components';
import { VocabCard } from '@/types';

const PAPER = '#F7F5EF'; // warm "real paper" page
const INK = '#26262B';
const ANGLES = [-4, 3, -2, 4, -3, 2, -5, 3];

/** Bigger cut-outs when there are fewer, so each day's page stays full. */
function itemSize(n: number): number {
  if (n <= 1) return 210;
  if (n === 2) return 172;
  if (n === 3) return 150;
  if (n <= 5) return 132;
  return 112;
}

/**
 * Home = a daily photo album (CapWords cut-outs × Instagram post). Each day is
 * a dotted-paper page that fills the screen, with the day's stickers pasted as
 * a centered collage. Swipe between days.
 */
export default function DiaryScreen() {
  const { diary, cards, profile } = useApp();
  const colors = useColors();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const boardH = Math.round(height * 0.58);

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
              <AppText variant="footnote" color={colors.secondaryLabel}>{dayCards.length}単語</AppText>
            </View>

            <ImageBackground
              source={require('../../assets/dot-tile.png')}
              resizeMode="repeat"
              imageStyle={{ borderRadius: radius.xl }}
              style={[styles.board, { minHeight: boardH }, shadow.card]}
            >
              <View style={styles.collage}>
                {dayCards.map((c, i) => (
                  <PressableScale
                    key={c.id}
                    onPress={() => router.push(`/card/${c.id}`)}
                    style={[styles.item, { transform: [{ rotate: `${ANGLES[i % ANGLES.length]}deg` }] }]}
                  >
                    <CutoutSticker uri={c.sticker} size={size} blur={blurAmount(c.srs)} />
                    <View style={styles.labelWrap}>
                      <AppText variant="headline" color={INK} numberOfLines={1} style={styles.word}>{c.word}</AppText>
                      {!!c.reading && (
                        <AppText variant="caption1" color="#6b6b70" numberOfLines={1}>{c.reading}</AppText>
                      )}
                    </View>
                  </PressableScale>
                ))}
              </View>
            </ImageBackground>
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
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: spacing.xxl,
  },
  item: { alignItems: 'center' },
  labelWrap: { alignItems: 'center', marginTop: spacing.xs },
  word: { fontWeight: '800' as const },
});
