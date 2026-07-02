import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

export function LivePulseDot({ color, size = 7, style }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dotColor = color ?? fieldGuide.moss;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.12, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  dot: {
    shadowColor: fieldGuide.moss,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },
});
}
