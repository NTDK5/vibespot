import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import fieldGuide from '../../theme/fieldGuide';
import { OnboardingHero, SignalChip } from './OnboardingPrimitives';

function PinStamp({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Circle cx="12" cy="9" r="2.5" fill={color} />
    </Svg>
  );
}

function SaveNode({ label, title, color, indent = 0 }) {
  return (
    <View style={[styles.node, indent > 0 && { marginLeft: indent }]}>
      <View style={styles.stamp}>
        <PinStamp color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.lbl}>{label.toUpperCase()}</Text>
        <Text style={styles.nodeTitle}>{title}</Text>
      </View>
    </View>
  );
}

export default function SaveIllustration({ chip }) {
  return (
    <OnboardingHero chip={<SignalChip bold={chip.bold} text={chip.text} dotVariant={chip.dot} />}>
      <Svg width="100%" height="100%" viewBox="0 0 354 420" preserveAspectRatio="xMidYMid slice">
        <Rect width="354" height="420" fill="#1a1f2e" />
        <Ellipse cx="177" cy="210" rx="120" ry="80" fill="#7A9B6A" opacity={0.05} />
      </Svg>
      <View style={styles.pathWrap}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 354 420" preserveAspectRatio="xMidYMid slice">
          <Path
            d="M 66 100 Q 120 160 177 200 Q 234 240 288 300"
            stroke="rgba(232,116,58,0.35)"
            strokeWidth={1.5}
            strokeDasharray="5 7"
            fill="none"
          />
        </Svg>
        <SaveNode label="Saved · Rainy day" title="Carmine" color={fieldGuide.ember} />
        <SaveNode label="Saved · Photo missions" title="Rua da Rosa alley" color={fieldGuide.gold} indent={24} />
        <SaveNode label="Saved · Date night" title="Miradouro do Sol" color={fieldGuide.moss} indent={48} />
      </View>
    </OnboardingHero>
  );
}

const styles = StyleSheet.create({
  pathWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 50,
    justifyContent: 'center',
  },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    zIndex: 1,
  },
  stamp: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(244, 239, 230, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 22, 29, 0.6)',
  },
  info: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(27, 30, 39, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    borderRadius: 12,
  },
  lbl: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 8,
    letterSpacing: fieldGuide.tracking.wide(8),
    textTransform: 'uppercase',
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
  nodeTitle: {
    marginTop: 3,
    fontFamily: fieldGuide.fonts.display,
    fontSize: 14,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
});
