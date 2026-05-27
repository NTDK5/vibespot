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
import fieldGuide from '../../../theme/fieldGuide';

const COLOR = {
  default: fieldGuide.inkLine,
  strong:  fieldGuide.inkLine2,
  paper:   'rgba(20,22,29,0.12)',
};

export default function Rule({ variant = 'default', style }) {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: COLOR[variant] || COLOR.default },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
