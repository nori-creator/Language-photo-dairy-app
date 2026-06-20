import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { blurAmount } from '@/lib/srs';
import { radius, shadow, spacing, useColors } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText, Icon, PressableScale, Sticker } from '@/components';
import { VocabCard } from '@/types';

/**
 * The home is a daily photo scrapbook: each day is a page, every captured
 * subject is "pasted" as a polaroid (gently rotated, taped, soft shadow) —
 * an American-yearbook cut-out album. Photos dominate the screen.
 */
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
      {/* Slim streak chip */}
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
            「撮る」で1日のページに写真を貼っていこう
          </AppText>
        </View>
      )}

      {diary.map((entry, idx) => {
        const dayCards = entry.cardIds.map((id) => cardById.get(id)).filter(Boolean) as VocabCard[];
        return (
          <Animated.View
            key={entry.date}
            entering={reduced ? undefined : FadeIn.delay(idx * 50).duration(360)}
            style={[styles.page, { backgroundColor: colors.secondarySystemGroupedBackground }]}
          >
            <View style={styles.pageHeader}>
              <AppText variant="title3">{formatDate(entry.date)}</AppText>
              <AppText variant="footnote" color={colors.secondaryLabel}>{dayCards.length}枚</AppText>
            </View>
            <View style={styles.board}>
              {dayCards.map((c, i) => (
                <Polaroid key={c.id} card={c} index={i} onPress={() => router.push(`/card/${c.id}`)} />
              ))}
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const ANGLES = [-5, 4, -3, 5, -4, 3, -2, 4];
const PHOTO = 150;

function Polaroid({ card, index, onPress }: { card: VocabCard; index: number; onPress: () => void }) {
  const angle = ANGLES[index % ANGLES.length];
  return (
    <PressableScale onPress={onPress} style={{ transform: [{ rotate: `${angle}deg` }] }}>
      <View style={[styles.polaroid, shadow.popover]}>
        <View style={styles.tape} />
        <View style={styles.photo}>
          <Sticker emoji={card.sticker} size={PHOTO} blur={blurAmount(card.srs)} />
        </View>
        <AppText variant="subhead" color="#1c1c1e" numberOfLines={1} style={styles.caption}>{card.word}</AppText>
      </View>
    </PressableScale>
  );
}

function formatDate(key: string): string {
  const d = new Date(key + 'T00:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const label = `${d.getMonth() + 1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`;
  return key === today ? `今日 · ${label}` : label;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  page: { borderRadius: radius.xl, padding: spacing.lg, paddingTop: spacing.md },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  board: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.sm },
  polaroid: {
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    paddingBottom: spacing.md,
    borderRadius: 4,
    alignItems: 'center',
  },
  tape: {
    position: 'absolute', top: -7, alignSelf: 'center',
    width: 54, height: 16, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.06)',
    transform: [{ rotate: '-3deg' }],
  },
  photo: { width: PHOTO, height: PHOTO, borderRadius: 2, overflow: 'hidden', backgroundColor: '#EDEDED' },
  caption: { marginTop: spacing.xs, maxWidth: PHOTO },
});
