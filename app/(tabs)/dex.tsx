import { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { CATEGORIES } from '@/data/categories';
import { categoryIcon } from '@/lib/categoryIcon';
import { categoryColor } from '@/lib/categoryColor';
import { blurAmount } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Card, Icon, PressableScale, ProgressBar, Sticker } from '@/components';
import { VocabCard } from '@/types';

export default function DexScreen() {
  const { cards } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<string, VocabCard[]>();
    for (const c of cards) map.set(c.categoryId, [...(map.get(c.categoryId) ?? []), c]);
    return map;
  }, [cards]);

  const total = cards.length;
  const goal = CATEGORIES.reduce((n, c) => n + (c.targetWords?.length ?? 0), 0);
  const shown = filter ? CATEGORIES.filter((c) => c.id === filter) : CATEGORIES;

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

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipBar}
      >
        <Chip label="すべて" active={filter === null} onPress={() => setFilter(null)} tint={colors.blue} colors={colors} />
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            icon={categoryIcon(cat.id)}
            active={filter === cat.id}
            onPress={() => setFilter(filter === cat.id ? null : cat.id)}
            tint={colors[categoryColor(cat.id)] as string}
            colors={colors}
          />
        ))}
      </ScrollView>

      {shown.map((cat) => {
        const owned = byCategory.get(cat.id) ?? [];
        const ownedWords = new Set(owned.map((c) => c.word));
        const locked = (cat.targetWords ?? []).filter((w) => !ownedWords.has(w));
        const count = cat.targetWords?.length ?? owned.length;
        const tint = colors[categoryColor(cat.id)] as string;
        return (
          <Card key={cat.id}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.catBadge, { backgroundColor: tint + '22' }]}>
                  <Icon name={categoryIcon(cat.id)} size={18} color={tint} />
                </View>
                <AppText variant="title3" color={tint}>{cat.name}</AppText>
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
                <Icon name="sparkles" size={14} color={tint} />
                <AppText variant="caption1" color={tint}>外に出て「？」の単語を撮って集めよう</AppText>
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
  tint,
  colors,
}: {
  label: string;
  icon?: any;
  active: boolean;
  onPress: () => void;
  tint: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      style={[styles.chip, { backgroundColor: active ? tint : tint + '1A' }]}
    >
      {icon && <Icon name={icon} size={15} color={active ? '#fff' : tint} />}
      <AppText variant="subhead" color={active ? '#fff' : tint}>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  chipBar: { marginHorizontal: -spacing.lg },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, height: 36, borderRadius: radius.full },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  catBadge: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  slot: { width: 68, alignItems: 'center', gap: spacing.xs },
  slotInner: { width: 68, height: 68, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
});
