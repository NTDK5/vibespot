/**
 * LoadingScreen — full-screen ink "reading the room" loader.
 *
 * Source: screens/24-loading.html. Centered CompassDial that both
 * spins and breathes; a DM Sans message below. A faint
 * skeleton row of `SpotCard`-shaped placeholders sits behind the
 * dial to hint "the page is on its way."
 *
 * Props:
 *   message?: string             default "Reading the room…"
 *   skeleton?: boolean           default true
 *   style?: ViewStyle            pass { height: 400, flex: 0 } for inline use
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import fieldGuide from '../../../theme/fieldGuide';
import CompassDial from '../signature/CompassDial';
import MonoMeta from '../primitives/MonoMeta';

function Skeleton() {
  return (
    <View style={skel.row} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <View key={i} style={skel.card} />
      ))}
    </View>
  );
}

export default function LoadingScreen({
  message = 'Reading the room…',
  skeleton = true,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      {skeleton ? <Skeleton /> : null}

      <View style={styles.center}>
        <CompassDial size={92} spinning breathing />
        <Text style={styles.msg}>{message}</Text>
        <MonoMeta size="eyebrow" style={styles.tag}>
          ONE MOMENT
        </MonoMeta>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 60,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  msg: {
    marginTop: 22,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 18,
    color: fieldGuide.cream,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tag: {
    marginTop: 8,
  },
});

const skel = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 48,
    left: 22,
    right: 22,
    flexDirection: 'row',
    gap: 14,
    opacity: 0.35,
  },
  card: {
    flex: 1,
    aspectRatio: 16 / 10,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: fieldGuide.inkElev,
  },
});
