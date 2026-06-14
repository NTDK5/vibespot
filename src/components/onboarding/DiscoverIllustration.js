import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { MapPin, OnboardingHero, SignalChip } from './OnboardingPrimitives';

export default function DiscoverIllustration({ chip }) {
  const skyId = useId().replace(/:/g, '');
  const pathId = useId().replace(/:/g, '');

  return (
    <OnboardingHero chip={<SignalChip bold={chip.bold} text={chip.text} dotVariant={chip.dot} />}>
      <Svg width="100%" height="100%" viewBox="0 0 354 420" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={skyId} x1="177" y1="0" x2="177" y2="420" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#2a3348" />
            <Stop offset="100%" stopColor="#0B0C11" />
          </LinearGradient>
          <LinearGradient id={pathId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#E8743A" stopOpacity={0} />
            <Stop offset="50%" stopColor="#E8743A" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#E8743A" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="354" height="420" fill={`url(#${skyId})`} />
        <Ellipse cx="177" cy="140" rx="160" ry="60" fill="#E8743A" opacity={0.07} />
        <G opacity={0.32} fill="rgba(27,30,39,0.7)" stroke="rgba(244,239,230,0.1)" strokeWidth={0.7}>
          <Rect x="20" y="180" width="58" height="40" rx="3" />
          <Rect x="88" y="168" width="48" height="52" rx="3" />
          <Rect x="148" y="175" width="70" height="44" rx="3" />
          <Rect x="228" y="170" width="56" height="48" rx="3" />
          <Rect x="292" y="178" width="42" height="38" rx="3" />
          <Rect x="36" y="232" width="52" height="36" rx="3" />
          <Rect x="100" y="228" width="76" height="42" rx="3" />
          <Rect x="188" y="230" width="64" height="38" rx="3" />
          <Rect x="264" y="226" width="54" height="40" rx="3" />
        </G>
        <G stroke="rgba(244,239,230,0.05)" strokeWidth={0.8}>
          <Line x1="0" y1="210" x2="354" y2="210" />
          <Line x1="0" y1="260" x2="354" y2="260" />
          <Line x1="88" y1="150" x2="88" y2="290" />
          <Line x1="177" y1="150" x2="177" y2="290" />
          <Line x1="266" y1="150" x2="266" y2="290" />
        </G>
        <Path
          d="M 40 290 Q 100 230 177 200 Q 254 170 314 150"
          stroke={`url(#${pathId})`}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="177" cy="240" r="22" stroke="rgba(232,116,58,0.2)" strokeWidth={1} fill="none" />
        <Circle cx="177" cy="240" r="12" stroke="rgba(232,116,58,0.35)" strokeWidth={1.2} fill="none" />
        <Circle cx="177" cy="240" r="4.5" fill="#E8743A" />
      </Svg>
      <View style={[styles.pin, { left: '24%', top: '52%' }]}>
        <MapPin variant="ember" />
      </View>
      <View style={[styles.pin, { left: '58%', top: '44%' }]}>
        <MapPin variant="gold" delay={500} />
      </View>
      <View style={[styles.pin, { left: '76%', top: '56%' }]}>
        <MapPin variant="moss" delay={1000} />
      </View>
    </OnboardingHero>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: 'absolute',
    zIndex: 2,
  },
});
