/**
 * LoadingScreen — full-screen ink "reading the room" loader.
 *
 * Source: screens/24-loading.html. Centered CompassDial that both
 * spins and breathes; a Fraunces italic message below. A faint
 * skeleton row of `SpotCard`-shaped placeholders sits behind the
 * dial to hint "the page is on its way."
 *
 * Props:
 *   message?: string             default "Reading the room…"
 *   skeleton?: boolean           default true
 *   style?: ViewStyle
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
        <View key={i} style={skel.card}>
          <View style={skel.img} />
          <View style={skel.line1} />
          <View style={skel.line2} />
        </View>
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
    fontFamily: fieldGuide.fonts.serifItalic,
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
    top: 40,
    left: 22,
    right: 22,
    flexDirection: 'row',
    opacity: 0.35,
  },
  card: {
    width: 130,
    marginRight: 14,
  },
  img: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: fieldGuide.radius.lg,
    backgroundColor: fieldGuide.inkElev,
  },
  line1: {
    marginTop: 10,
    height: 12,
    width: '70%',
    borderRadius: 2,
    backgroundColor: fieldGuide.inkElev,
  },
  line2: {
    marginTop: 6,
    height: 8,
    width: '50%',
    borderRadius: 2,
    backgroundColor: fieldGuide.inkElev,
  },
});
