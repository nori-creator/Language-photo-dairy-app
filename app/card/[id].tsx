import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { categoryById } from '@/data/categories';
import { categoryIcon } from '@/lib/categoryIcon';
import { services } from '@/services';
import { feedback } from '@/lib/feedback';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Card, Icon, PressableScale, Sticker } from '@/components';
import { VocabCard } from '@/types';

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, deleteCard } = useApp();
  const colors = useColors();
  const router = useRouter();
  const card = cards.find((c) => c.id === id);

  const confirmDelete = () => {
    Alert.alert('カードを削除', 'このカードを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          if (id) deleteCard(id);
          router.back();
        },
      },
    ]);
  };

  if (!card) {
    return (
      <View style={[styles.center, { backgroundColor: colors.systemGroupedBackground }]}>
        <AppText>カードが見つかりません</AppText>
      </View>
    );
  }

  const date = new Date(card.capturedAt);
  const speak = () => {
    feedback.tap();
    services.tts.speak({ text: card.word, target: card.targetLanguage }).catch(() => {});
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: card.word,
          headerRight: () => (
            <PressableScale onPress={confirmDelete} haptic={false} style={styles.delete}>
              <Icon name="trash-outline" size={22} color={colors.red} />
            </PressableScale>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
      >
        {/* Hero photo */}
        <View style={[styles.hero, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
          <Sticker emoji={card.sticker} size={260} />
        </View>

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="largeTitle">{card.word}</AppText>
            {!!card.reading && <AppText variant="title3" color={colors.secondaryLabel}>{card.reading}</AppText>}
          </View>
          <PressableScale onPress={speak} style={[styles.speaker, { backgroundColor: colors.blue }]}>
            <Icon name="volume-high" size={24} color="#fff" />
          </PressableScale>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {!!card.level && <Badge text={card.level} colors={colors} />}
          {!!card.partOfSpeech && card.partOfSpeech !== '—' && <Badge text={card.partOfSpeech} colors={colors} />}
        </View>

        {/* Meaning */}
        {!!card.meaning && (
          <Card>
            <AppText variant="body">{card.meaning}</AppText>
          </Card>
        )}

        {/* Examples */}
        {card.examples.length > 0 && (
          <Section title="例文" colors={colors}>
            {card.examples.map((e, i) => (
              <View key={i} style={i > 0 ? { marginTop: spacing.md } : undefined}>
                <AppText variant="callout">{e.text}</AppText>
                <AppText variant="footnote" color={colors.secondaryLabel}>{e.translation}</AppText>
              </View>
            ))}
          </Section>
        )}

        {card.collocations.length > 0 && (
          <Section title="コロケーション" colors={colors}>
            <AppText variant="callout">{card.collocations.join(' / ')}</AppText>
          </Section>
        )}

        {(card.synonyms.length > 0 || card.antonyms.length > 0) && (
          <Section title="類義語・反意語" colors={colors}>
            {card.synonyms.length > 0 && <AppText variant="callout">≈ {card.synonyms.join('、')}</AppText>}
            {card.antonyms.length > 0 && <AppText variant="callout">↔ {card.antonyms.join('、')}</AppText>}
          </Section>
        )}

        {!!card.etymology && (
          <Section title="語源" colors={colors}>
            <AppText variant="callout">{card.etymology}</AppText>
          </Section>
        )}

        {!!card.note && (
          <Section title="ひとこと" colors={colors}>
            <AppText variant="callout">{card.note}</AppText>
          </Section>
        )}

        {/* Meta */}
        <View style={styles.meta}>
          <MetaRow icon={categoryIcon(card.categoryId)} text={categoryById(card.categoryId)?.name ?? '—'} colors={colors} />
          <MetaRow icon="calendar-outline" text={`${date.getMonth() + 1}月${date.getDate()}日に取得`} colors={colors} />
          {!!card.location?.name && <MetaRow icon="location-outline" text={card.location.name} colors={colors} />}
        </View>
      </ScrollView>
    </>
  );
}

function Badge({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.fill }]}>
      <AppText variant="footnote" color={colors.secondaryLabel}>{text}</AppText>
    </View>
  );
}

function Section({ title, colors, children }: { title: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <Card>
      <AppText variant="footnote" color={colors.secondaryLabel} style={styles.sectionLabel}>{title}</AppText>
      {children}
    </Card>
  );
}

function MetaRow({ icon, text, colors }: { icon: any; text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={18} color={colors.secondaryLabel} />
      <AppText variant="subhead" color={colors.secondaryLabel}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 300, borderRadius: radius.xxl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  speaker: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.xs },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  sectionLabel: { marginBottom: spacing.xs },
  meta: { gap: spacing.sm, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  delete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
