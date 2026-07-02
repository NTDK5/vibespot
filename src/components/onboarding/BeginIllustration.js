import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import FenaLogoMark from '../brand/FenaLogoMark';
import { OnboardingHero, SignalChip } from './OnboardingPrimitives';

function OrbitPin({ style, color }) {
  const { fieldGuide } = useTheme();

  const pinColor = color ?? fieldGuide.ember;
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.orbitPin,
        {
          backgroundColor: pinColor,
          shadowColor: pinColor,
        },
        style,
      ]}
    />
  );
}

export default function BeginIllustration({ chip }) {
  const { fieldGuide, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const glowId = useId().replace(/:/g, '');
  const skyBase = isDark ? fieldGuide.canvasDeep : fieldGuide.paperSoft;
  const starFill = isDark ? 'rgba(244,239,230,0.2)' : 'rgba(20,22,29,0.15)';
  const orbitStroke = isDark ? 'rgba(244,239,230,0.08)' : 'rgba(20,22,29,0.08)';

  return (
    <OnboardingHero chip={<SignalChip bold={chip.bold} text={chip.text} dotVariant={chip.dot} />}>
      <Svg width="100%" height="100%" viewBox="0 0 354 420" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="45%" r="50%">
            <Stop offset="0%" stopColor="#E8743A" stopOpacity={0.15} />
            <Stop offset="100%" stopColor={skyBase} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="354" height="420" fill={skyBase} />
        <Rect width="354" height="420" fill={`url(#${glowId})`} />
        <G fill={starFill}>
          <Circle cx="60" cy="80" r="1" />
          <Circle cx="290" cy="70" r="0.9" />
          <Circle cx="120" cy="55" r="0.8" />
          <Circle cx="240" cy="95" r="1" />
        </G>
      </Svg>
      <View style={styles.converge}>
        <View style={styles.orbit}>
          <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
            <Circle
              cx="100"
              cy="100"
              r="78"
              stroke={orbitStroke}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <Circle cx="100" cy="100" r="58" stroke="rgba(232,116,58,0.2)" strokeWidth={1.5} />
            <Path
              d="M 100 22 Q 140 60 178 100 Q 140 140 100 178 Q 60 140 22 100 Q 60 60 100 22"
              stroke="rgba(232,116,58,0.35)"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="6 8"
            />
            <Line x1="100" y1="42" x2="100" y2="100" stroke="rgba(232,116,58,0.25)" strokeWidth={1} />
            <Line x1="158" y1="100" x2="100" y2="100" stroke="rgba(201,162,75,0.2)" strokeWidth={1} />
            <Line x1="100" y1="158" x2="100" y2="100" stroke="rgba(122,155,106,0.2)" strokeWidth={1} />
          </Svg>
          <View style={styles.logoWrap}>
            <FenaLogoMark width={72} />
          </View>
          <OrbitPin style={styles.pinTop} />
          <OrbitPin
            style={styles.pinRight}
            color={fieldGuide.gold}
          />
          <OrbitPin
            style={styles.pinBottom}
            color={fieldGuide.moss}
          />
          <OrbitPin style={styles.pinLeft} color={fieldGuide.emberSoft} />
        </View>
      </View>
    </OnboardingHero>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  converge: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  orbit: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  logoWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -36 }, { translateY: -36 }],
    shadowColor: fieldGuide.ember,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  orbitPin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  pinTop: {
    top: '8%',
    left: '50%',
    transform: [{ translateX: -5 }],
  },
  pinRight: {
    top: '50%',
    right: '6%',
    transform: [{ translateY: -5 }],
  },
  pinBottom: {
    bottom: '8%',
    left: '50%',
    transform: [{ translateX: -5 }],
  },
  pinLeft: {
    top: '50%',
    left: '6%',
    transform: [{ translateY: -5 }],
  },
});
}
