/**
 * DisplayTitle — Fraunces serif title with an optional italicized
 * emphasis span (the "Evening, *Oliver.*" construction).
 *
 * CSS ref: .greeting / .display / .spot-name (L107-114, L497-503) and
 * the heroic title block in screens/13-spot-detail.html L81-85.
 *
 * Props:
 *   children: string                       full title text
 *   italic?: string                        substring to render italic
 *   size?: 'sm'|'md'|'lg'|'xl'|'hero'      14 / 22 / 28 / 36 / 42
 *   weight?: '300'|'400'|'500'|'700'       maps to Fraunces variant
 *   color?: string                         default cream
 *   italicColor?: string                   default emberSoft
 *   style?: TextStyle
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import fieldGuide from '../../../theme/fieldGuide';

const SIZE_FS = { sm: 14, md: 22, lg: 28, xl: 36, hero: 42 };
// 1.05 line-height per .greeting / .body h3 in css_app.css
const SIZE_LH = { sm: 18, md: 26, lg: 32, xl: 38, hero: 44 };

const WEIGHT_FAMILY = {
  '300': fieldGuide.fonts.serifLight,
  '400': fieldGuide.fonts.serif,
  '500': fieldGuide.fonts.serifMedium,
  '700': fieldGuide.fonts.serifBold,
};

export default function DisplayTitle({
  children,
  italic,
  size = 'lg',
  weight = '400',
  color,
  italicColor,
  style,
}) {
  const fs = SIZE_FS[size] || SIZE_FS.lg;
  const lh = SIZE_LH[size] || SIZE_LH.lg;
  const family = WEIGHT_FAMILY[weight] || WEIGHT_FAMILY['400'];
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

  if (!italic || typeof children !== 'string') {
    return <Text style={[styles.base, baseStyle, style]}>{children}</Text>;
  }

  const text = children;
  const idx = text.indexOf(italic);
  if (idx === -1) {
    return <Text style={[styles.base, baseStyle, style]}>{text}</Text>;
  }
  const prefix = text.slice(0, idx);
  const middle = text.slice(idx, idx + italic.length);
  const suffix = text.slice(idx + italic.length);

  return (
    <Text style={[styles.base, baseStyle, style]}>
      {prefix}
      <Text style={{ fontFamily: fieldGuide.fonts.serifItalic, color: emFill }}>
        {middle}
      </Text>
      {suffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
