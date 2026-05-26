/**
 * MosaicCover — 16:9 five-tile mosaic used as the visual identity of
 * a collection. Mirrors the .grid-thumbs CSS grid from
 * screens/10-collections.html (L49-71) and the .col-hero .grid block
 * from screens/11-collection-detail.html (L34-46).
 *
 * Layout (no CSS grid in RN — flexbox row/columns instead):
 *
 *   ┌───────────────┬─────────┬─────────┐
 *   │               │  tile1  │  tile2  │
 *   │    tile0      ├─────────┼─────────┤
 *   │   (span 2)    │  tile3  │  tile4  │
 *   └───────────────┴─────────┴─────────┘
 *
 * Tile0 takes 2fr; tile1–tile4 share the right 1fr+1fr. The fifth
 * cell flips into the "+N" overlay (serif 16 cream over inkElev) when
 * `extraCount` is positive.
 *
 * Props:
 *   vibes: string[]              up to 5 vibe keys (cafe, roof, ...).
 *                                Short arrays are padded with inkElev
 *                                fills so the mosaic never collapses.
 *   extraCount?: number          if > 0, replaces the bottom-right tile
 *                                with the "+N" plaque.
 *   aspectRatio?: number         default 16/9; pass 1 for a square
 *                                edit-preview, 16/10 for the create
 *                                screen's hero, etc.
 *   gap?: number                 hairline-ish gap between tiles, px.
 *   radius?: number              outer corner radius. Default 0 — the
 *                                wrapping card usually clips us.
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import DuotoneVibe from '../spot/DuotoneVibe';

function Tile({ vibe, children, style }) {
  return (
    <View style={[styles.tile, style]}>
      {vibe ? (
        <DuotoneVibe vibe={vibe} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fieldGuide.inkElev }]} />
      )}
      {children}
    </View>
  );
}

export default function MosaicCover({
  vibes = [],
  extraCount = 0,
  aspectRatio = 16 / 9,
  gap = 2,
  radius = 0,
  style,
}) {
  // Pad to 5 so we don't have to gate every render with length checks.
  const filled = [...vibes];
  while (filled.length < 5) filled.push(null);
  const [v0, v1, v2, v3, v4] = filled;

  const hasOverlay = extraCount > 0;

  return (
    <View
      style={[
        {
          aspectRatio,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: fieldGuide.ink,
          flexDirection: 'row',
          gap,
        },
        style,
      ]}
    >
      {/* Left "span 2" tile */}
      <View style={{ flex: 2 }}>
        <Tile vibe={v0} />
      </View>

      {/* Right 2×2 grid */}
      <View style={{ flex: 2, gap }}>
        <View style={[styles.rightRow, { gap }]}>
          <View style={{ flex: 1 }}><Tile vibe={v1} /></View>
          <View style={{ flex: 1 }}><Tile vibe={v2} /></View>
        </View>
        <View style={[styles.rightRow, { gap }]}>
          <View style={{ flex: 1 }}><Tile vibe={v3} /></View>
          <View style={{ flex: 1 }}>
            {hasOverlay ? (
              <View style={[styles.tile, styles.overlay]}>
                <Text style={styles.overlayText}>{`+${extraCount}`}</Text>
              </View>
            ) : (
              <Tile vibe={v4} />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rightRow: {
    flex: 1,
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fieldGuide.inkElev,
  },
  overlayText: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 16,
    includeFontPadding: false,
  },
});
