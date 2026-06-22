import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useApp } from '@/store/AppStore';
import { isDue } from '@/lib/srs';
import { feedback } from '@/lib/feedback';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Card, Icon, ListGroup, PressableScale, PrimaryButton, ProgressBar, Row } from '@/components';
import { Ionicons } from '@expo/vector-icons';

const STRICTNESS: { key: 'lenient' | 'normal' | 'strict'; label: string }[] = [
  { key: 'lenient', label: 'やさしい' },
  { key: 'normal', label: 'ふつう' },
  { key: 'strict', label: 'きびしい' },
];

export default function ProfileScreen() {
  const { cards, profile, session, signOut, updateProfile } = useApp();
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
        <Stat icon="flame" tint={colors.orange} value={`${profile.streak}`} label="連続日数" colors={colors} />
        <Divider colors={colors} />
        <Stat icon="albums" tint={colors.blue} value={`${stats.total}`} label="集めた単語" colors={colors} />
        <Divider colors={colors} />
        <Stat icon="sparkles" tint={colors.green} value={`${stats.learned}`} label="習得済み" colors={colors} />
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

      {/* Pronunciation strictness */}
      <Card>
        <AppText variant="headline">発音判定の厳しさ</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          復習でぼやけを直すときの発音採点の合格ラインです。
        </AppText>
        <View style={styles.segment}>
          {STRICTNESS.map((s) => {
            const active = (profile.pronStrictness ?? 'normal') === s.key;
            return (
              <PressableScale
                key={s.key}
                haptic={false}
                onPress={() => { feedback.tap(); updateProfile({ pronStrictness: s.key }); }}
                style={[styles.segItem, { backgroundColor: active ? colors.blue : colors.fill }]}
              >
                <AppText variant="subhead" color={active ? '#fff' : colors.label}>{s.label}</AppText>
              </PressableScale>
            );
          })}
        </View>
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

function Stat({ icon, tint, value, label, colors }: { icon: keyof typeof Ionicons.glyphMap; tint: string; value: string; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint + '22' }]}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <AppText variant="title2" style={{ marginTop: spacing.xs }} color={tint}>{value}</AppText>
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
  statIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: radius.md },
});
