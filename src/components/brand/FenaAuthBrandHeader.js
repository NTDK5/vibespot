/**
 * Vertical auth brand stack: stamp mark, FENA wordmark, tagline.
 * Uses logo-mark-alt.svg via FenaLogoMark.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BRAND } from '../../brand/fena';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { MonoMeta } from '../fieldguide';
import FenaLogoMark from './FenaLogoMark';

export default function FenaAuthBrandHeader({
  markWidth = 128,
  accessibilityLabel = BRAND.logoA11yLabel,
  testID = 'fena-auth-brand-header',
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={styles.stack}
      accessibilityLabel={accessibilityLabel}
      accessible
      testID={testID}
    >
      <FenaLogoMark width={markWidth} accessibilityLabel="" accessible={false} />
      <Text style={styles.name}>{BRAND.name}</Text>
      <MonoMeta size="eyebrow" style={styles.tagline}>
        {BRAND.tagline.toUpperCase()}
      </MonoMeta>
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  stack: {
    alignItems: 'center',
  },
  name: {
    marginTop: 18,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 15,
    letterSpacing: 8,
    color: fieldGuide.ember,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 2.4,
    color: fieldGuide.creamMute,
    maxWidth: 280,
  },
});
}
