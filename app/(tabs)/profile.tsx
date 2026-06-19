import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useApp } from '@/store/AppStore';
import { isDue } from '@/lib/srs';
import { radius, spacing, useColors } from '@/theme';
import { AppText } from '@/components';

export default function ProfileScreen() {
  const { cards, profile } = useApp();
  const colors = useColors();

  const stats = useMemo(() => {
    const learned = cards.filter((c) => c.srs.repetitions >= 2).length;
    const dueNow = cards.filter((c) => isDue(c.srs)).length;
    return { total: cards.length, learned, dueNow };
  }, [cards]);

  const goal = profile.goal;
  const progress = goal ? Math.min(1, stats.total / goal.requiredWords) : 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {/* Streak */}
      <View style={[styles.row, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <Stat emoji="🔥" value={`${profile.streak}`} label="連続日数" colors={colors} />
        <Divider colors={colors} />
        <Stat emoji="📸" value={`${stats.total}`} label="集めた単語" colors={colors} />
        <Divider colors={colors} />
        <Stat emoji="🧠" value={`${stats.learned}`} label="習得済み" colors={colors} />
      </View>

      {/* Certification goal */}
      {goal && (
        <View style={[styles.card, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
          <View style={styles.goalHeader}>
            <AppText variant="headline">{goal.name}</AppText>
            <AppText variant="subhead" color={colors.secondaryLabel}>
              {stats.total} / {goal.requiredWords} 語
            </AppText>
          </View>
          <View style={[styles.track, { backgroundColor: colors.fill }]}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.green }]} />
          </View>
          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.sm }}>
            あと {Math.max(0, goal.requiredWords - stats.total)} 語。未取得の単語は図鑑で「？」表示 → 撮って集めよう。
          </AppText>
        </View>
      )}

      {/* Reminder habit */}
      <View style={[styles.card, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <AppText variant="headline">毎日のリマインダー</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.xs }}>
          {profile.habitHour != null
            ? `いつも ${profile.habitHour}時頃に学習 → 明日も同じ時間に通知します`
            : '学習時間を学習して、最適な時間に通知します'}
        </AppText>
      </View>

      {/* Settings */}
      <View style={[styles.card, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <SettingRow label="学習言語" value="台湾華語 (繁体字)" colors={colors} />
        <Divider colors={colors} horizontal />
        <SettingRow label="母語" value="日本語" colors={colors} />
        <Divider colors={colors} horizontal />
        <SettingRow label="プラン" value={profile.plan === 'pro' ? 'Pro' : '無料'} colors={colors} />
      </View>
    </ScrollView>
  );
}

function Stat({ emoji, value, label, colors }: { emoji: string; value: string; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.stat}>
      <AppText style={{ fontSize: 24 }}>{emoji}</AppText>
      <AppText variant="title2">{value}</AppText>
      <AppText variant="caption1" color={colors.secondaryLabel}>{label}</AppText>
    </View>
  );
}

function Divider({ colors, horizontal }: { colors: ReturnType<typeof useColors>; horizontal?: boolean }) {
  return (
    <View
      style={
        horizontal
          ? { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: spacing.md }
          : { width: StyleSheet.hairlineWidth, backgroundColor: colors.separator, alignSelf: 'stretch' }
      }
    />
  );
}

function SettingRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.settingRow}>
      <AppText variant="body">{label}</AppText>
      <AppText variant="body" color={colors.secondaryLabel}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  card: { borderRadius: radius.lg, padding: spacing.lg },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  track: { height: 12, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
});
