import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { categoryById } from '@/data/categories';
import { categoryIcon } from '@/lib/categoryIcon';
import { categoryColor } from '@/lib/categoryColor';
import { services } from '@/services';
import { feedback } from '@/lib/feedback';
import { radius, shadow, spacing, useColors } from '@/theme';
import { AppText, Card, CutoutSticker, Icon, PressableScale } from '@/components';

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, deleteCard } = useApp();
  const colors = useColors();
  const router = useRouter();
  const card = cards.find((c) => c.id === id);

  const confirmDelete = () => {
    Alert.alert('カードを削除', 'このカードを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => { if (id) deleteCard(id); router.back(); } },
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
  const tintBlue = colors.blue + '14'; // deep, translucent blue
  const catColor = colors[categoryColor(card.categoryId)] as string;
  const speak = () => {
    feedback.tap();
    services.tts.speak({ text: card.word, target: card.targetLanguage }).catch(() => {});
  };
  const say = (text: string) => {
    feedback.tap();
    services.tts.speak({ text, target: card.targetLanguage }).catch(() => {});
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
      <ScrollView style={{ backgroundColor: colors.systemGroupedBackground }} contentContainerStyle={styles.content}>
        {/* Hero cut-out */}
        <View style={[styles.hero, { backgroundColor: colors.secondarySystemGroupedBackground }, shadow.card]}>
          <CutoutSticker uri={card.sticker} size={240} />
        </View>

        {/* Title + big floating speak button */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="largeTitle" style={styles.word}>{card.word}</AppText>
            {!!card.reading && <AppText variant="title3" color={colors.blue}>{card.reading}</AppText>}
          </View>
          <PressableScale onPress={speak} style={[styles.speak, { backgroundColor: colors.blue, shadowColor: colors.blue }]}>
            <Icon name="volume-high" size={26} color="#fff" />
          </PressableScale>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {!!card.level && <Badge text={card.level} tint={tintBlue} color={colors.blue} />}
          {!!card.partOfSpeech && card.partOfSpeech !== '—' && (
            <Badge text={card.partOfSpeech} tint={colors.fill} color={colors.secondaryLabel} />
          )}
          <Badge text={categoryById(card.categoryId)?.name ?? ''} tint={catColor + '22'} color={catColor} />
        </View>

        {/* Meaning (tinted blue) */}
        {!!card.meaning && (
          <View style={[styles.meaning, { backgroundColor: tintBlue }]}>
            <AppText variant="body">{card.meaning}</AppText>
          </View>
        )}

        {card.examples.length > 0 && (
          <Section title="例文" accent={colors.green} colors={colors}>
            {card.examples.map((e, i) => (
              <View key={i} style={i > 0 ? { marginTop: spacing.md } : undefined}>
                <PressableScale onPress={() => say(e.text)} style={styles.exampleRow}>
                  <AppText variant="callout" style={{ flex: 1 }}>{e.text}</AppText>
                  <Icon name="volume-medium" size={16} color={colors.blue} />
                </PressableScale>
                <AppText variant="footnote" color={colors.secondaryLabel}>{e.translation}</AppText>
              </View>
            ))}
          </Section>
        )}
        {card.collocations.length > 0 && (
          <Section title="コロケーション" accent={colors.indigo} colors={colors}>
            <View style={styles.chips}>
              {card.collocations.map((w, i) => <WordChip key={i} text={w} onPress={() => say(w)} colors={colors} />)}
            </View>
          </Section>
        )}
        {(card.synonyms.length > 0 || card.antonyms.length > 0) && (
          <Section title="類義語・反意語" accent={colors.teal} colors={colors}>
            {card.synonyms.length > 0 && (
              <View style={styles.chips}>
                {card.synonyms.map((w, i) => <WordChip key={`s${i}`} text={`≈ ${w}`} onPress={() => say(w)} colors={colors} />)}
              </View>
            )}
            {card.antonyms.length > 0 && (
              <View style={[styles.chips, { marginTop: spacing.sm }]}>
                {card.antonyms.map((w, i) => <WordChip key={`a${i}`} text={`↔ ${w}`} onPress={() => say(w)} colors={colors} />)}
              </View>
            )}
          </Section>
        )}
        {!!card.etymology && (
          <Section title="語源" accent={colors.orange} colors={colors}><AppText variant="callout">{card.etymology}</AppText></Section>
        )}
        {!!card.note && (
          <Section title="ひとこと" accent={colors.pink} colors={colors}><AppText variant="callout">{card.note}</AppText></Section>
        )}

        {/* Meta */}
        <View style={styles.meta}>
          <MetaRow icon={categoryIcon(card.categoryId)} text={categoryById(card.categoryId)?.name ?? '—'} colors={colors} tint={catColor} />
          <MetaRow icon="calendar-outline" text={`${date.getMonth() + 1}月${date.getDate()}日に取得`} colors={colors} />
          {!!card.location?.name && <MetaRow icon="location-outline" text={card.location.name} colors={colors} />}
        </View>
      </ScrollView>
    </>
  );
}

function Badge({ text, tint, color }: { text: string; tint: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: tint }]}>
      <AppText variant="footnote" color={color}>{text}</AppText>
    </View>
  );
}

function Section({ title, accent, colors, children }: { title: string; accent?: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <Card>
      <AppText variant="footnote" color={accent ?? colors.secondaryLabel} style={[styles.sectionLabel, { fontWeight: '700' }]}>
        {title}
      </AppText>
      {children}
    </Card>
  );
}

/** A blue pill that floats up when pressed; tap to hear it spoken. */
function WordChip({ text, onPress, colors }: { text: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <PressableScale onPress={onPress} haptic={false} style={[styles.chip, { backgroundColor: colors.blue + '16', shadowColor: colors.blue }]}>
      <AppText variant="subhead" color={colors.blue}>{text}</AppText>
      <Icon name="volume-low" size={13} color={colors.blue} />
    </PressableScale>
  );
}

function MetaRow({ icon, text, colors, tint }: { icon: any; text: string; colors: ReturnType<typeof useColors>; tint?: string }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={18} color={tint ?? colors.secondaryLabel} />
      <AppText variant="subhead" color={colors.secondaryLabel}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 300, borderRadius: radius.xxl, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  word: { fontWeight: '800' as const },
  speak: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.xs },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  meaning: { borderRadius: radius.lg, padding: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full,
    shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  meta: { gap: spacing.sm, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  delete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
