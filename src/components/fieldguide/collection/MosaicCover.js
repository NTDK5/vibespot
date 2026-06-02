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
import { Image, StyleSheet, Text, View } from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import DuotoneVibe from '../spot/DuotoneVibe';

function Tile({ vibe, image, children, style }) {
  return (
    <View style={[styles.tile, style]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : vibe ? (
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
  images = [],
  extraCount = 0,
  aspectRatio = 16 / 9,
  gap = 2,
  radius = 0,
  style,
}) {
  const sourceCount = Math.max(vibes.length, images.length);
  const filledVibes = [...vibes];
  const filledImages = [...images];
  while (filledVibes.length < 5) filledVibes.push(null);
  while (filledImages.length < 5) filledImages.push(null);
  const [v0, v1, v2, v3, v4] = filledVibes;
  const [i0, i1, i2, i3, i4] = filledImages;

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
      {sourceCount <= 1 ? (
        <Tile vibe={v0} image={i0} />
      ) : sourceCount === 2 ? (
        <>
          <View style={{ flex: 1 }}>
            <Tile vibe={v0} image={i0} />
          </View>
          <View style={{ flex: 1 }}>
            <Tile vibe={v1} image={i1} />
          </View>
        </>
      ) : sourceCount === 3 ? (
        <>
          <View style={{ flex: 2 }}>
            <Tile vibe={v0} image={i0} />
          </View>
          <View style={{ flex: 1, gap }}>
            <View style={{ flex: 1 }}>
              <Tile vibe={v1} image={i1} />
            </View>
            <View style={{ flex: 1 }}>
              <Tile vibe={v2} image={i2} />
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Left "span 2" tile */}
          <View style={{ flex: 2 }}>
            <Tile vibe={v0} image={i0} />
          </View>

          {/* Right 2×2 grid */}
          <View style={{ flex: 2, gap }}>
            <View style={[styles.rightRow, { gap }]}>
              <View style={{ flex: 1 }}><Tile vibe={v1} image={i1} /></View>
              <View style={{ flex: 1 }}><Tile vibe={v2} image={i2} /></View>
            </View>
            <View style={[styles.rightRow, { gap }]}>
              <View style={{ flex: 1 }}><Tile vibe={v3} image={i3} /></View>
              <View style={{ flex: 1 }}>
                {hasOverlay ? (
                  <View style={[styles.tile, styles.overlay]}>
                    <Text style={styles.overlayText}>{`+${extraCount}`}</Text>
                  </View>
                ) : (
                  <Tile vibe={v4} image={i4} />
                )}
              </View>
            </View>
          </View>
        </>
      )}
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
  image: {
    ...StyleSheet.absoluteFillObject,
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
