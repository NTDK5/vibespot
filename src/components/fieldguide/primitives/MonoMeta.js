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
import fieldGuide from '../../../theme/fieldGuide';

const SIZE_FS = {
  eyebrow: 10,
  kicker:  9,
  spot:    9.5,
  tab:     8.5,
};

// em multipliers from css_app.css mapped to the px helpers in
// fieldGuide.tracking. eyebrow 0.22em, kicker 0.28em, spot 0.20em,
// tab 0.18em.
const SIZE_TRACK = {
  eyebrow: fieldGuide.tracking.widest,
  kicker:  fieldGuide.tracking.mono28,
  spot:    fieldGuide.tracking.wider,
  tab:     fieldGuide.tracking.wide,
};

const SIZE_FAMILY = {
  eyebrow: fieldGuide.fonts.mono,
  kicker:  fieldGuide.fonts.monoMed,
  spot:    fieldGuide.fonts.mono,
  tab:     fieldGuide.fonts.mono,
};

const SIZE_COLOR = {
  eyebrow: fieldGuide.creamMute,
  kicker:  fieldGuide.ember,
  spot:    fieldGuide.creamMute,
  tab:     fieldGuide.creamFaint,
};

export default function MonoMeta({ children, size = 'eyebrow', color, style }) {
  const fs = SIZE_FS[size];
  const ls = SIZE_TRACK[size](fs);
  return (
    <Text
      style={[
        styles.base,
        {
          fontFamily: SIZE_FAMILY[size],
          fontSize: fs,
          letterSpacing: ls,
          color: color || SIZE_COLOR[size],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
