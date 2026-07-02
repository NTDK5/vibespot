/**
 * VisitStampButton — press-and-hold to stamp a spot visit.
 * variant="grid" — Spot Detail actions row; variant="cta" — sticky bottom bar.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

const HOLD_MS = 800;
const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function VisitStampButton({
  onVisit,
  busy = false,
  disabled = false,
  variant = 'grid',
  style,
  onDisabledPress,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isCta = variant === 'cta';
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const holdAnim = useRef(null);
  const completingRef = useRef(false);
  const [holding, setHolding] = useState(false);

  const iconColor = isCta ? fieldGuide.onCreamFill : fieldGuide.text;
  const ringTrackColor = isCta ? fieldGuide.inkLine2 : fieldGuide.inkLine2;

  const resetProgress = useCallback(() => {
    holdAnim.current?.stop();
    holdAnim.current = null;
    progress.setValue(0);
    setHolding(false);
  }, [progress]);

  const runCompletePulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  const handleHoldComplete = useCallback(async () => {
    if (completingRef.current || busy || disabled) return;
    completingRef.current = true;
    setHolding(false);
    runCompletePulse();
    try {
      await onVisit?.();
    } finally {
      completingRef.current = false;
      progress.setValue(0);
    }
  }, [busy, disabled, onVisit, progress, runCompletePulse]);

  const onPressIn = useCallback(() => {
    if (disabled) {
      onDisabledPress?.();
      return;
    }
    if (busy || completingRef.current) return;
    setHolding(true);
    holdAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished && !busy && !disabled && !completingRef.current) {
        handleHoldComplete();
      }
    });
  }, [busy, disabled, handleHoldComplete, onDisabledPress, progress]);

  const onPressOut = useCallback(() => {
    if (completingRef.current || disabled) return;
    resetProgress();
  }, [disabled, resetProgress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_C, 0],
  });

  const shellStyle = isCta ? styles.ctaBtn : styles.action;
  const iconWrapSize = isCta ? 52 : 40;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Hold to stamp visit"
      accessibilityHint="Press and hold to mark that you visited this spot"
      accessibilityState={{ disabled: disabled || busy }}
      style={({ pressed }) => [
        shellStyle,
        style,
        {
          opacity: disabled ? 0.45 : busy ? 0.55 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          { width: iconWrapSize, height: iconWrapSize, transform: [{ scale }] },
        ]}
      >
        <Svg width={iconWrapSize} height={iconWrapSize} style={styles.ringSvg}>
          <Circle
            cx={iconWrapSize / 2}
            cy={iconWrapSize / 2}
            r={RING_R}
            stroke={ringTrackColor}
            strokeWidth={2}
            fill="none"
          />
          {(holding || busy) && !disabled ? (
            <G rotation={-90} origin={`${iconWrapSize / 2}, ${iconWrapSize / 2}`}>
              <AnimatedCircle
                cx={iconWrapSize / 2}
                cy={iconWrapSize / 2}
                r={RING_R}
                stroke={fieldGuide.ember}
                strokeWidth={2.5}
                fill="none"
                strokeDasharray={`${RING_C}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          ) : null}
        </Svg>
        <Ionicons
          name="footsteps-outline"
          size={isCta ? 18 : 16}
          color={iconColor}
          style={styles.icon}
        />
      </Animated.View>
      {!isCta ? (
        <Text style={styles.label}>
          {busy ? 'STAMPING' : holding ? 'HOLD…' : 'VISIT'}
        </Text>
      ) : null}
    </Pressable>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  action: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: fieldGuide.creamFill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  icon: {
    position: 'relative',
  },
  label: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
    color: fieldGuide.text,
    includeFontPadding: false,
  },
});
}