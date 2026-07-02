/**
 * Rule — hairline divider.
 *
 * CSS ref: .rule / .rule-strong / .paper .rule (L576-583)
 *
 * Props:
 *   variant?: 'default' | 'strong' | 'paper'   default 'default'
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

export default function Rule({ variant = 'default', style }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const colors = {
    default: fieldGuide.inkLine,
    strong: fieldGuide.inkLine2,
    paper: fieldGuide.line,
  };
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors[variant] || colors.default },
        style,
      ]}
    />
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  base: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
}
