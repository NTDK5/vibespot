/**
 * SheetHandle — 36x4 rounded bar that sits at the top of bottom sheets.
 *
 * CSS ref: .sheet-handle (L771-776)
 *
 * Props:
 *   color?: string         default inkLine2 (or ink-text 22% on paper)
 *   style?: ViewStyle      overrides the centered margin if needed
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

export default function SheetHandle({ color, style }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.handle,
        { backgroundColor: color || fieldGuide.inkLine2 },
        style,
      ]}
    />
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  handle: {
    width: 36,
    height: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginVertical: 8,
  },
});
}
