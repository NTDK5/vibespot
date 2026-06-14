import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import fieldGuide from '../../theme/fieldGuide';

const HERO_HEIGHT = 420;
const HERO_MARGIN = 18;

export function OnboardingHero({ chip, children }) {
  return (
    <View style={styles.hero}>
      <HeroGlow />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
      {chip}
    </View>
  );
}

export function HeroGlow() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(232, 116, 58, 0.18)',
          'rgba(232, 116, 58, 0.06)',
          'transparent',
        ]}
        locations={[0, 0.35, 0.6]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(11, 12, 17, 0.92)']}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const DOT_COLORS = {
  moss: { bg: fieldGuide.moss, shadow: 'rgba(122, 155, 106, 0.55)' },
  ember: { bg: fieldGuide.ember, shadow: 'rgba(232, 116, 58, 0.5)' },
  gold: { bg: fieldGuide.gold, shadow: 'rgba(201, 162, 75, 0.45)' },
};

export function PulseDot({ variant = 'moss', size = 6, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const colors = DOT_COLORS[variant] || DOT_COLORS.moss;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
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
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.82, 1],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.bg,
          transform: [{ scale }],
          opacity,
          shadowColor: colors.bg,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
        },
        style,
      ]}
    />
  );
}

export function SignalChip({ bold, text, dotVariant = 'moss' }) {
  return (
    <BlurView tint="dark" intensity={28} style={styles.chip}>
      <PulseDot variant={dotVariant} />
      <Text style={styles.chipText} numberOfLines={1}>
        <Text style={styles.chipBold}>{bold}</Text>
        {text}
      </Text>
    </BlurView>
  );
}

export function MapPin({ variant = 'ember', delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const palettes = {
    ember: {
      dot: fieldGuide.ember,
      ring: 'rgba(232, 116, 58, 0.22)',
    },
    gold: {
      dot: fieldGuide.gold,
      ring: 'rgba(201, 162, 75, 0.2)',
    },
    moss: {
      dot: fieldGuide.moss,
      ring: 'rgba(122, 155, 106, 0.2)',
    },
  };
  const palette = palettes[variant] || palettes.ember;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.12, 1],
  });

  return (
    <View style={styles.pinWrap}>
      <Animated.View
        style={[
          styles.pinDot,
          {
            backgroundColor: palette.dot,
            transform: [{ scale }],
            shadowColor: palette.dot,
            borderColor: palette.ring,
          },
        ]}
      />
      <View style={[styles.pinTail, { borderTopColor: palette.dot }]} />
    </View>
  );
}

export function SlideBody({ stepNum, stepLabel, headlineBefore, headlineAccent, headlineAfter, body }) {
  return (
    <View style={styles.body}>
      <Text style={styles.step}>
        <Text style={styles.stepNum}>{stepNum}</Text>
        {` / 04 · ${stepLabel}`}
      </Text>
      <Text style={styles.headline}>
        {headlineBefore}
        <Text style={styles.headlineAccent}>{headlineAccent}</Text>
        {headlineAfter}
      </Text>
      <Text style={styles.paragraph}>{body}</Text>
    </View>
  );
}

export { HERO_HEIGHT, HERO_MARGIN };

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
    marginHorizontal: HERO_MARGIN,
    borderRadius: fieldGuide.radius.xl,
    overflow: 'hidden',
    backgroundColor: '#1a1f2e',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    position: 'relative',
  },
  chip: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: 'rgba(20, 22, 29, 0.78)',
    overflow: 'hidden',
    maxWidth: '85%',
  },
  chipText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  chipBold: {
    color: fieldGuide.cream,
    fontFamily: fieldGuide.fonts.monoMed,
  },
  pinWrap: {
    alignItems: 'center',
    transform: [{ translateX: -4.5 }, { translateY: -15 }],
  },
  pinDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 16,
    flexShrink: 0,
  },
  step: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.mono28(10),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
    marginBottom: 10,
    includeFontPadding: false,
  },
  stepNum: {
    color: fieldGuide.ember,
  },
  headline: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 32,
    lineHeight: Math.round(32 * 1.08),
    letterSpacing: fieldGuide.tracking.tight(32),
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  headlineAccent: {
    color: fieldGuide.ember,
  },
  paragraph: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: Math.round(14 * 1.55),
    color: fieldGuide.creamSoft,
    maxWidth: 280,
  },
});
