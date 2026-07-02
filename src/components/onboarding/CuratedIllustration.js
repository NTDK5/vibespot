import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Rect } from 'react-native-svg';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { OnboardingHero, SignalChip } from './OnboardingPrimitives';

function SpotCard({ name, meta, badge, badgeVariant, style }) {
  const styles = useThemedStyles(createStyles);
  const badgeStyle =
    badgeVariant === 'gold'
      ? styles.badgeGold
      : badgeVariant === 'ember'
        ? styles.badgeEmber
        : styles.badgeDefault;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.img}>
        <LinearGradient
          colors={['#2a3348', '#1a1f2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(11, 12, 17, 0.7)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.badge, badgeStyle]}>{badge.toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{meta.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export default function CuratedIllustration({ chip }) {
  const styles = useThemedStyles(createStyles);
  return (
    <OnboardingHero chip={<SignalChip bold={chip.bold} text={chip.text} dotVariant={chip.dot} />}>
      <Svg width="100%" height="100%" viewBox="0 0 354 420" preserveAspectRatio="xMidYMid slice">
        <Rect width="354" height="420" fill="#14161D" />
        <Ellipse cx="177" cy="200" rx="140" ry="100" fill="#E8743A" opacity={0.06} />
      </Svg>
      <View style={styles.stack}>
        <SpotCard
          name="Miradouro do Sol"
          meta="Viewpoint · 0.8 mi"
          badge="Trending"
          style={styles.card1}
        />
        <SpotCard
          name="Carmine"
          meta="Café · 0.4 mi · Open now"
          badge="Editor's pick"
          badgeVariant="gold"
          style={styles.card2}
        />
        <SpotCard
          name="Loose Tongue"
          meta="Bar · 1.2 mi"
          badge="Champion"
          badgeVariant="ember"
          style={styles.card3}
        />
      </View>
    </OnboardingHero>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  stack: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 28,
    zIndex: 2,
  },
  card: {
    position: 'absolute',
    width: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 50,
    elevation: 12,
  },
  card1: {
    transform: [{ rotate: '-8deg' }, { translateX: -28 }, { translateY: 18 }],
    opacity: 0.72,
    zIndex: 1,
  },
  card2: {
    transform: [{ rotate: '2deg' }, { translateY: -8 }],
    zIndex: 3,
  },
  card3: {
    transform: [{ rotate: '10deg' }, { translateX: 32 }, { translateY: 24 }],
    opacity: 0.85,
    zIndex: 2,
  },
  img: {
    height: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: fieldGuide.radius.full,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 8,
    letterSpacing: fieldGuide.tracking.wide(8),
    textTransform: 'uppercase',
    backgroundColor: 'rgba(20, 22, 29, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    color: fieldGuide.creamMute,
    overflow: 'hidden',
  },
  badgeGold: {
    color: fieldGuide.gold,
    borderColor: 'rgba(201, 162, 75, 0.35)',
  },
  badgeEmber: {
    color: fieldGuide.ember,
    borderColor: 'rgba(232, 116, 58, 0.35)',
  },
  badgeDefault: {},
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  name: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 15,
    letterSpacing: -0.01 * 15,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  meta: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
});
}
