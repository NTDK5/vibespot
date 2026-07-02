/**
 * DuotoneVibe — duotone gradient stand-in for a real photo.
 *
 * CSS ref: .ph / .ph-cafe ... .ph-cream (css_app.css L532-550). When an
 * `image` source is passed, render the image and overlay the gradient
 * at ~0.45 opacity to mimic a duotone treatment.
 *
 * Angles per CSS:
 *   135deg → cafe / alley / studio / paper / cream
 *   160deg → gallery / night / court
 *   180deg → roof / park / water / desert
 *
 * Props:
 *   vibe: key of fieldGuide.vibes
 *   image?: ImageSourcePropType
 *   style?: ViewStyle                 caller usually passes absoluteFillObject
 */

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


// 135deg: top-left → bottom-right
// 160deg: roughly top-left → bottom-right at steeper angle
// 180deg: top → bottom
const VIBE_ANGLE = {
  cafe:    { start: { x: 0,    y: 0 }, end: { x: 1,    y: 1 } },
  alley:   { start: { x: 0,    y: 0 }, end: { x: 1,    y: 1 } },
  studio:  { start: { x: 0,    y: 0 }, end: { x: 1,    y: 1 } },
  paper:   { start: { x: 0,    y: 0 }, end: { x: 1,    y: 1 } },
  cream:   { start: { x: 0,    y: 0 }, end: { x: 1,    y: 1 } },
  gallery: { start: { x: 0.16, y: 0 }, end: { x: 0.84, y: 1 } },
  night:   { start: { x: 0.16, y: 0 }, end: { x: 0.84, y: 1 } },
  court:   { start: { x: 0.16, y: 0 }, end: { x: 0.84, y: 1 } },
  roof:    { start: { x: 0.5,  y: 0 }, end: { x: 0.5,  y: 1 } },
  park:    { start: { x: 0.5,  y: 0 }, end: { x: 0.5,  y: 1 } },
  water:   { start: { x: 0.5,  y: 0 }, end: { x: 0.5,  y: 1 } },
  desert:  { start: { x: 0.5,  y: 0 }, end: { x: 0.5,  y: 1 } },
};

// Mid-stop offsets per CSS for the three-stop gradients. cafe is the
// only one that doesn't pin its middle at 0.5 (it uses 45%); others
// use 50% or 60%. expo-linear-gradient takes `locations` 0..1.
const VIBE_LOCATIONS = {
  cafe:    [0, 0.45, 1],
  roof:    [0, 0.5,  1],
  gallery: [0, 0.6,  1],
  park:    [0, 0.6,  1],
  night:   [0, 0.5,  1],
  alley:   [0, 0.6,  1],
  water:   [0, 0.6,  1],
  desert:  [0, 0.5,  1],
  studio:  [0, 0.5,  1],
  court:   [0, 0.6,  1],
  paper:   [0, 0.6,  1],
  cream:   [0, 1],
};

export default function DuotoneVibe({ vibe, image, style }) {
  const { fieldGuide } = useTheme();
  const colors = fieldGuide.vibes[vibe] || fieldGuide.vibes.cafe;
  const angle = VIBE_ANGLE[vibe] || VIBE_ANGLE.cafe;
  const locations = VIBE_LOCATIONS[vibe] || (
    colors.length === 2 ? [0, 1] : [0, 0.5, 1]
  );

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {image ? (
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}
      <LinearGradient
        // expo-linear-gradient expects a mutable array; spread to copy.
        colors={[...colors]}
        locations={locations}
        start={angle.start}
        end={angle.end}
        style={[
          StyleSheet.absoluteFill,
          { opacity: image ? 0.45 : 1 },
        ]}
      />
    </View>
  );
}
