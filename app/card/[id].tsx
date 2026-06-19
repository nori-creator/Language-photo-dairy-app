import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store/AppStore';
import { categoryById } from '@/data/categories';
import { spacing, useColors } from '@/theme';
import { AppText, VocabCardView } from '@/components';

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards } = useApp();
  const colors = useColors();
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return (
      <View style={styles.center}>
        <AppText>カードが見つかりません</AppText>
      </View>
    );
  }

  const date = new Date(card.capturedAt);

  return (
    <>
      <Stack.Screen options={{ title: card.word }} />
      <ScrollView
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
      >
        <VocabCardView card={card} />

        <View style={styles.meta}>
          <Row icon="albums-outline" text={categoryById(card.categoryId)?.name ?? '—'} colors={colors} />
          <Row icon="calendar-outline" text={`${date.getMonth() + 1}月${date.getDate()}日に取得`} colors={colors} />
          {card.location?.name && (
            <Row icon="location-outline" text={card.location.name} colors={colors} />
          )}
        </View>

        {card.location?.name && (
          <AppText variant="footnote" color={colors.secondaryLabel} style={styles.locHint}>
            この場所を再び歩くと「ここで撮ったよ」とリマインダーが届きます（将来機能）
          </AppText>
        )}
      </ScrollView>
    </>
  );
}

function Row({ icon, text, colors }: { icon: any; text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.secondaryLabel} />
      <AppText variant="subhead" color={colors.secondaryLabel}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meta: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locHint: { marginTop: -spacing.sm },
});
