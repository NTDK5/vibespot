/**
 * IconSquare — 44×44 glass icon button used by the Map's top controls
 * and side rail.
 *
 * CSS ref: .icon-square (screens/09-map.html L30-40). A hairline border
 * sits over a translucent ink fill with an expo-blur backdrop so the
 * button reads as floating chrome on top of the map tiles.
 *
 * Props:
 *   onPress: () => void
 *   children: ReactNode               icon node, typically an Ionicons
 *   size?: number                     default 44
 *   radius?: number                   default 14
 *   surface?: 'glass' | 'cream'       default 'glass'. 'cream' renders
 *                                      the solid paper variant used for
 *                                      the "Search this area" pill.
 *   accessibilityLabel?: string
 *   style?: ViewStyle                 extra positioning overrides
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

export default function IconSquare({
  onPress,
  children,
  size = 44,
  radius = 14,
  surface = 'glass',
  accessibilityLabel,
  style,
}) {
  const styles = useThemedStyles(createStyles);
  const dim = { width: size, height: size, borderRadius: radius };
  const isGlass = surface === 'glass';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.wrap,
        dim,
        style,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      {isGlass ? (
        <BlurView tint="dark" intensity={28} style={[styles.fill, dim, styles.glass]}>
          {children}
        </BlurView>
      ) : (
        <View style={[styles.fill, dim, styles.cream]}>
          {children}
        </View>
      )}
    </Pressable>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  wrap: {
    overflow: 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: fieldGuide.canvasElev,
    borderColor: fieldGuide.inkLine,
  },
  cream: {
    backgroundColor: fieldGuide.creamFill,
    borderColor: fieldGuide.creamFill,
  },
});
}
