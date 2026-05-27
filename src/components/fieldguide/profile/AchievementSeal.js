/**
 * AchievementSeal — horizontal badge card for Profile achievements.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import MonoMeta from '../primitives/MonoMeta';

const GLYPHS = {
  welcome: '✦',
  explorer: '☼',
  collector: '◎',
  reviewer: '✎',
  champion: '★',
  default: '✦',
};

function glyphFor(badge) {
  if (badge?.icon && String(badge.icon).length <= 2) return badge.icon;
  const name = String(badge?.name || '').toLowerCase();
  if (name.includes('welcome')) return GLYPHS.welcome;
  if (name.includes('explorer')) return GLYPHS.explorer;
  if (name.includes('collect')) return GLYPHS.collector;
  if (name.includes('review')) return GLYPHS.reviewer;
  if (name.includes('champion')) return GLYPHS.champion;
  return GLYPHS.default;
}

export default function AchievementSeal({ badge, style }) {
  const unlocked = !!badge?.unlocked;
  const glyph = glyphFor(badge);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.ring}>
        <View style={[styles.seal, !unlocked && styles.sealLocked]}>
          <Text style={styles.glyph}>{glyph}</Text>
          {!unlocked ? <View style={styles.lockOverlay} /> : null}
        </View>
      </View>
      <MonoMeta size="spot" style={styles.name}>
        {badge?.name || 'Seal'}
      </MonoMeta>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 92,
    alignItems: 'center',
  },
  ring: {
    padding: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: fieldGuide.inkLine2,
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: fieldGuide.emberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sealLocked: {
    opacity: 0.55,
  },
  glyph: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.ink,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,22,29,0.35)',
  },
  name: {
    marginTop: 8,
    textAlign: 'center',
    color: fieldGuide.creamMute,
    fontSize: 8.5,
    letterSpacing: fieldGuide.tracking.wider(8.5),
  },
});
