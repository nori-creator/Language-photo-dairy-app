import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { VocabCard } from '@/types';
import { radius, shadow, spacing, useColors } from '@/theme';
import { blurAmount } from '@/lib/srs';
import { services } from '@/services';
import { AppText } from './AppText';
import { Sticker } from './Sticker';

/** A Pokémon-style collectible card: tap to flip and reveal the full entry. */
export function VocabCardView({ card }: { card: VocabCard }) {
  const colors = useColors();
  const spin = useSharedValue(0);

  const flip = () => {
    Haptics.selectionAsync().catch(() => {});
    spin.value = withTiming(spin.value === 0 ? 1 : 0, { duration: 450 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(spin.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(spin.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const playAudio = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    services.tts.speak({ text: card.word, target: card.targetLanguage }).catch(() => {});
  };

  const surface = { backgroundColor: colors.secondarySystemGroupedBackground };

  return (
    <Pressable onPress={flip}>
      <View style={styles.stage}>
        {/* FRONT */}
        <Animated.View style={[styles.face, surface, shadow.lg, frontStyle]}>
          <LinearGradient
            colors={[colors.fill, 'transparent']}
            style={styles.spotlight}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={[styles.platform, { backgroundColor: colors.fill }]}>
            <Sticker emoji={card.sticker} size={140} blur={blurAmount(card.srs)} />
          </View>
          <AppText variant="largeTitle">{card.word}</AppText>
          <AppText variant="headline" color={colors.secondaryLabel}>{card.reading}</AppText>
          <View style={[styles.levelPill, { backgroundColor: colors.fill }]}>
            <AppText variant="caption1" color={colors.secondaryLabel}>{card.level}</AppText>
          </View>
          <AppText variant="footnote" color={colors.tertiaryLabel} style={styles.flipHint}>
            タップで詳細
          </AppText>
        </Animated.View>

        {/* BACK */}
        <Animated.View style={[styles.face, styles.back, surface, shadow.lg, backStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.backContent}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="title1">{card.word}</AppText>
                <AppText variant="subhead" color={colors.secondaryLabel}>
                  {card.reading} · {card.ipa} · {card.partOfSpeech}
                </AppText>
              </View>
              <Pressable onPress={playAudio} hitSlop={12} style={[styles.speaker, { backgroundColor: colors.blue }]}>
                <Ionicons name="volume-high" size={22} color="#fff" />
              </Pressable>
            </View>

            <AppText variant="body" style={styles.meaning}>{card.meaning}</AppText>

            <Field label="例文" colors={colors}>
              {card.examples.map((e, i) => (
                <View key={i} style={{ marginBottom: spacing.sm }}>
                  <AppText variant="callout">{e.text}</AppText>
                  <AppText variant="footnote" color={colors.secondaryLabel}>{e.translation}</AppText>
                </View>
              ))}
            </Field>

            {card.collocations.length > 0 && (
              <Field label="コロケーション" colors={colors}>
                <AppText variant="callout">{card.collocations.join(' / ')}</AppText>
              </Field>
            )}
            {(card.synonyms.length > 0 || card.antonyms.length > 0) && (
              <Field label="類義語・反意語" colors={colors}>
                {card.synonyms.length > 0 && (
                  <AppText variant="callout">≈ {card.synonyms.join('、')}</AppText>
                )}
                {card.antonyms.length > 0 && (
                  <AppText variant="callout">↔ {card.antonyms.join('、')}</AppText>
                )}
              </Field>
            )}
            {!!card.etymology && (
              <Field label="語源" colors={colors}>
                <AppText variant="callout">{card.etymology}</AppText>
              </Field>
            )}
            {!!card.note && (
              <Field label="ひとこと" colors={colors}>
                <AppText variant="callout">{card.note}</AppText>
              </Field>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Pressable>
  );
}

function Field({ label, colors, children }: { label: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <AppText variant="footnote" color={colors.secondaryLabel} style={styles.fieldLabel}>
        {label.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

const CARD_HEIGHT = 460;

const styles = StyleSheet.create({
  stage: { height: CARD_HEIGHT },
  face: {
    position: 'absolute',
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spotlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%', opacity: 0.7 },
  platform: {
    width: 180,
    height: 180,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  back: { alignItems: 'stretch', justifyContent: 'flex-start' },
  backContent: { paddingVertical: spacing.xs },
  levelPill: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  flipHint: { marginTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  speaker: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  meaning: { marginTop: spacing.md },
  fieldLabel: { marginBottom: spacing.xs, letterSpacing: 0.5 },
});
