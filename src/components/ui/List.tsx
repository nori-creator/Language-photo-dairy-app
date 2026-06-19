import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, shadow, spacing, useColors } from '@/theme';
import { AppText } from '../AppText';

/** iOS inset-grouped list container. Children are Rows separated by hairlines. */
export function ListGroup({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: colors.secondarySystemGroupedBackground }, shadow.card]}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 && <View style={[styles.sep, { backgroundColor: colors.separator }]} />}
          {child}
        </View>
      ))}
    </View>
  );
}

/** A single settings/list row: leading content, label, trailing value/control. */
export function Row({ label, value, trailing }: { label: string; value?: string; trailing?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <AppText variant="body">{label}</AppText>
      <View style={styles.trailing}>
        {value != null && <AppText variant="body" color={colors.secondaryLabel}>{value}</AppText>}
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: radius.lg, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  } as any,
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
