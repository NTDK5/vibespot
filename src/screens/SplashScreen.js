/**
 * SplashScreen — VibeSpot wordmark + compass dial cluster.
 *
 * Source: screens/01-splash.html. Holds for ~1200ms after mount then
 * decides where to send the user. Only mounted when `!onboarded`
 * (see AppNavigator) — so in practice the only route this needs to
 * push to is Onboarding, but we keep the defensive decision tree
 * from the spec for forward-compatibility.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import fieldGuide from '../theme/fieldGuide';
import {
  CompassDial,
  DisplayTitle,
  MonoMeta,
} from '../components/fieldguide';
import { useAuth } from '../hooks/useAuth';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

const HOLD_MS = 1200;

export default function SplashScreen({ navigation }) {
  const { user } = useAuth();
  const { onboarded } = useFirstLaunch();

  useEffect(() => {
    const t = setTimeout(() => {
      // Defensive decision tree per spec. AppNavigator usually swaps
      // stacks on its own once `user` becomes truthy, so the third
      // branch is rarely hit, but it stays for safety.
      if (!onboarded) {
        navigation.replace('Onboarding');
      } else if (!user) {
        navigation.replace('SignIn');
      } else {
        navigation.replace('MainTabs');
      }
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [navigation, onboarded, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.dialBg} pointerEvents="none">
        <CompassDial size={320} spinning color={fieldGuide.cream} />
      </View>

      <View style={styles.center}>
        <View style={styles.ringWrap}>
          <View style={styles.outerDashed} />
          <View style={styles.innerDashed} />
          <View style={styles.ring}>
            <Text style={styles.spark}>✦</Text>
          </View>
        </View>

        <DisplayTitle size="hero" weight="500" style={styles.wordmark}>
          VibeSpot
        </DisplayTitle>

        <MonoMeta size="eyebrow" style={styles.tag}>
          A FIELD GUIDE TO PLACES
        </MonoMeta>
      </View>

      <View style={styles.footer}>
        <MonoMeta size="tab" color={fieldGuide.creamFaint}>
          VOL. 04 · NO. 028 · ISSUE SUMMER
        </MonoMeta>
      </View>
    </SafeAreaView>
  );
}

const RING = 132;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dialBg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 320,
    height: 320,
    marginLeft: -160,
    marginTop: -160,
    opacity: 0.16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerDashed: {
    position: 'absolute',
    top: -22,
    left: -22,
    right: -22,
    bottom: -22,
    borderRadius: (RING + 44) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  innerDashed: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: (RING + 20) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    borderStyle: 'dashed',
  },
  spark: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 56,
    color: fieldGuide.ember,
    lineHeight: 56,
    includeFontPadding: false,
  },
  wordmark: {
    textAlign: 'center',
  },
  tag: {
    marginTop: 14,
    textAlign: 'center',
    letterSpacing: 3.6,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
