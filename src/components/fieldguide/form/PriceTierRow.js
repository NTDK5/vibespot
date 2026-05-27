/**
 * PriceTierRow — four € tier cells for spot submission.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import MonoMeta from '../primitives/MonoMeta';

/** Display € tiers while preserving backend priceRange values. */
export const WIZARD_PRICE_TIERS = [
  { label: '€', value: 'low' },
  { label: '€€', value: 'medium' },
  { label: '€€€', value: 'high' },
  { label: '€€€€', value: 4 },
];

export default function PriceTierRow({ value, onChange, style }) {
  return (
    <View style={style}>
      <MonoMeta size="eyebrow" style={styles.label}>
        Price tier
      </MonoMeta>
      <View style={styles.row}>
        {WIZARD_PRICE_TIERS.map((tier) => {
          const on = value === tier.value;
          return (
            <Pressable
              key={String(tier.value)}
              onPress={() => onChange(tier.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={tier.label}
              style={({ pressed }) => [
                styles.cell,
                on && styles.cellOn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.priceText, on && styles.priceTextOn]}>
                {tier.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.inkElev,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellOn: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  priceText: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  priceTextOn: {
    color: '#FFF8F1',
  },
});
