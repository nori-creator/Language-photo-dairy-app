import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useApp } from '@/store/AppStore';
import { isDue } from '@/lib/srs';
import { spacing, useColors } from '@/theme';
import { AppText, Card, Icon, ListGroup, PrimaryButton, ProgressBar, Row } from '@/components';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { cards, profile, session, signOut } = useApp();
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
      {/* Stats */}
      <Card style={styles.statRow}>
        <Stat icon="flame" value={`${profile.streak}`} label="連続日数" colors={colors} />
        <Divider colors={colors} />
        <Stat icon="albums" value={`${stats.total}`} label="集めた単語" colors={colors} />
        <Divider colors={colors} />
        <Stat icon="sparkles" value={`${stats.learned}`} label="習得済み" colors={colors} />
      </Card>

      {/* Certification goal */}
      {goal && (
        <Card>
          <View style={styles.goalHeader}>
            <AppText variant="headline">{goal.name}</AppText>
            <AppText variant="subhead" color={colors.secondaryLabel}>{stats.total} / {goal.requiredWords} 語</AppText>
          </View>
          <ProgressBar progress={progress} style={{ marginTop: spacing.md }} />
          <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.md }}>
            あと {Math.max(0, goal.requiredWords - stats.total)} 語。未取得は図鑑で「？」表示 → 撮って集めよう。
          </AppText>
        </Card>
      )}

      {/* Reminder habit */}
      <Card>
        <AppText variant="headline">毎日のリマインダー</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.xs }}>
          {profile.habitHour != null
            ? `いつも ${profile.habitHour}時頃に学習 → 明日も同じ時間に通知します`
            : '学習時間を学習して、最適な時間に通知します'}
        </AppText>
      </Card>

      {/* Settings */}
      <ListGroup>
        <Row label="学習言語" value="台湾華語 (繁体字)" />
        <Row label="母語" value="日本語" />
        <Row label="プラン" value={profile.plan === 'pro' ? 'Pro' : '無料'} />
        <Row label="アカウント" value={session?.user.email ?? '—'} />
      </ListGroup>

      <PrimaryButton title="ログアウト" onPress={signOut} variant="tinted" />
    </ScrollView>
  );
}

function Stat({ icon, value, label, colors }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={22} color={colors.secondaryLabel} />
      <AppText variant="title2" style={{ marginTop: spacing.xs }}>{value}</AppText>
      <AppText variant="caption1" color={colors.secondaryLabel}>{label}</AppText>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.separator }} />;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
