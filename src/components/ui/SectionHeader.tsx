import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, useColors } from '@/theme';
import { AppText } from '../AppText';

/**
 * Left-aligned section header. Title in headline weight, optional trailing
 * accessory (count, action). Groups separate by whitespace, not rules.
 */
export function SectionHeader({ title, accessory }: { title: string; accessory?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <AppText variant="title3">{title}</AppText>
      {typeof accessory === 'string' ? (
        <AppText variant="subhead" color={colors.secondaryLabel}>{accessory}</AppText>
      ) : (
        accessory
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
});
