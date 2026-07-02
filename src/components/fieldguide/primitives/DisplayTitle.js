/**
 * DisplayTitle — Syne display headline with optional ember accent span.
 *
 * Replaces the former Fraunces serif + italic emphasis pattern.
 * Emphasis is rendered in emberSoft at normal weight, not serif italic.
 *
 * Props:
 *   children: string                       full title text
 *   italic?: string                        substring to accent (ember color)
 *   size?: 'sm'|'md'|'lg'|'xl'|'hero'      14 / 22 / 28 / 36 / 42
 *   weight?: '300'|'400'|'500'|'700'       maps to Syne 700; 700 → Syne 800
 *   color?: string                         default cream
 *   italicColor?: string                   default emberSoft
 *   numberOfLines?: number                 clamp lines (wrap rather than grow)
 *   adjustsFontSizeToFit?: boolean         shrink to fit numberOfLines
 *   style?: TextStyle
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

const SIZE_FS = { sm: 14, md: 22, lg: 28, xl: 36, hero: 42 };
// Syne is a tall geometric face: descenders (g, p, y, j, q) sit lower
// than Fraunces did, so line-heights run ~1.3× the font size and the
// base style keeps a touch of bottom padding to stop Android clipping.
const SIZE_LH = { sm: 20, md: 30, lg: 38, xl: 48, hero: 56 };

function weightFamily(fieldGuide, weight) {
  const map = {
    '300': fieldGuide.fonts.display,
    '400': fieldGuide.fonts.display,
    '500': fieldGuide.fonts.display,
    '700': fieldGuide.fonts.displayHeavy,
  };
  return map[weight] || map['400'];
}

export default function DisplayTitle({
  children,
  italic,
  size = 'lg',
  weight = '400',
  color,
  italicColor,
  numberOfLines,
  adjustsFontSizeToFit,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const fs = SIZE_FS[size] || SIZE_FS.lg;
  const lh = SIZE_LH[size] || SIZE_LH.lg;
  const family = weightFamily(fieldGuide, weight);
  const fill = color || fieldGuide.cream;
  const emFill = italicColor || fieldGuide.emberSoft;

  const tightLs = fieldGuide.tracking.tight(fs);

  const baseStyle = {
    fontFamily: family,
    fontSize: fs,
    lineHeight: lh,
    letterSpacing: tightLs,
    color: fill,
  };

  const extraProps = {
    ...(numberOfLines ? { numberOfLines } : null),
    ...(adjustsFontSizeToFit ? { adjustsFontSizeToFit, minimumFontScale: 0.7 } : null),
  };

  if (!italic || typeof children !== 'string') {
    return (
      <Text style={[styles.base, baseStyle, style]} {...extraProps}>
        {children}
      </Text>
    );
  }

  const text = children;
  const idx = text.indexOf(italic);
  if (idx === -1) {
    return (
      <Text style={[styles.base, baseStyle, style]} {...extraProps}>
        {text}
      </Text>
    );
  }
  const prefix = text.slice(0, idx);
  const middle = text.slice(idx, idx + italic.length);
  const suffix = text.slice(idx + italic.length);

  return (
    <Text style={[styles.base, baseStyle, style]} {...extraProps}>
      {prefix}
      <Text style={{ fontFamily: family, color: emFill, fontStyle: 'normal' }}>
        {middle}
      </Text>
      {suffix}
    </Text>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  base: {
    includeFontPadding: true,
    paddingBottom: 2,
  },
});
}
