/**
 * SaveStamp — round "tuck it in your pocket" button at the top-right
 * of every spot photo.
 *
 * CSS ref: .spot-photo .save-stamp / .save-stamp.saved (css_app.css
 * L466-481). Animation beat: on tap the stamp dips to 0.92 and rotates
 * -8 to 0 deg (the "stamp settling on paper" cue).
 *
 * Props:
 *   saved: boolean
 *   onToggle: () => void
 *   size?: number                default 34
 *   style?: ViewStyle            position override (defaults to top:10 right:10)
 *
 * Wrapped in absolute positioning so it can drop straight into <SpotPhoto>.
 */

import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import fieldGuide from '../../../theme/fieldGuide';

const DEFAULT_SIZE = 34;

export default function SaveStamp({
  saved = false,
  onToggle,
  size = DEFAULT_SIZE,
  style,
}) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (saved) {
      rotate.value = withSequence(
        withTiming(-8, { duration: 0 }),
        withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [saved, rotate]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 90, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 220, mass: 0.6 }),
    );
    onToggle && onToggle();
  };

  const dim = { width: size, height: size, borderRadius: size / 2 };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from pocket' : 'Stamp into pocket'}
      accessibilityState={{ selected: saved }}
      hitSlop={10}
      style={[styles.wrap, dim, style]}
    >
      <Animated.View style={[styles.inner, dim, aStyle]}>
        {saved ? (
          <View
            style={[
              styles.fill,
              dim,
              { backgroundColor: fieldGuide.ember, borderColor: fieldGuide.ember },
            ]}
          >
            <Ionicons name="bookmark" size={14} color="#FFF8F1" />
          </View>
        ) : Platform.OS === 'android' ? (
          <View
            style={[
              styles.fill,
              dim,
              {
                backgroundColor: 'rgba(20,22,29,0.55)',
                borderColor: 'rgba(244,239,230,0.18)',
              },
            ]}
          >
            <Ionicons name="bookmark-outline" size={14} color={fieldGuide.cream} />
          </View>
        ) : (
          <BlurView
            tint="dark"
            intensity={28}
            style={[
              styles.fill,
              dim,
              {
                backgroundColor: 'rgba(20,22,29,0.55)',
                borderColor: 'rgba(244,239,230,0.18)',
              },
            ]}
          >
            <Ionicons name="bookmark-outline" size={14} color={fieldGuide.cream} />
          </BlurView>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    overflow: 'visible',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
