/**
 * MonoMeta — uppercase mono caption.
 *
 * CSS ref: .eyebrow / .kicker / .spot-meta / .tabbar-item label in
 * `css_app.css` (L116-137, L322-358, L483-495). Pulls the size-specific
 * fontSize + tracking + default color from `fieldGuide` tokens so the
 * caller only picks a `size`.
 *
 * Props:
 *   children: ReactNode
 *   size?: 'eyebrow' | 'kicker' | 'spot' | 'tab'   default 'eyebrow'
 *   color?: string                                  override default-by-size
 *   style?: TextStyle
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

const SIZE_FS = {
  eyebrow: 10,
  kicker:  9,
  spot:    9.5,
  tab:     8.5,
};

// em multipliers from css_app.css mapped to the px helpers in
// fieldGuide.tracking. eyebrow 0.22em, kicker 0.28em, spot 0.20em,
// tab 0.18em.
export default function MonoMeta({ children, size = 'eyebrow', color, style }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const fs = SIZE_FS[size];
  const ls = fieldGuide.tracking[
    size === 'kicker' ? 'mono28' : size === 'spot' ? 'wider' : size === 'tab' ? 'wide' : 'widest'
  ](fs);
  const sizeColor = {
    eyebrow: fieldGuide.creamMute,
    kicker: fieldGuide.ember,
    spot: fieldGuide.creamMute,
    tab: fieldGuide.creamFaint,
  };
  const sizeFamily = {
    eyebrow: fieldGuide.fonts.mono,
    kicker: fieldGuide.fonts.monoMed,
    spot: fieldGuide.fonts.mono,
    tab: fieldGuide.fonts.mono,
  };
  return (
    <Text
      style={[
        styles.base,
        {
          fontFamily: sizeFamily[size],
          fontSize: fs,
          letterSpacing: ls,
          color: color || sizeColor[size],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  base: {
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
}
