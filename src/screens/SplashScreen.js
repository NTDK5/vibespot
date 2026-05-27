/**
 * SplashScreen — FENA stamp mark + tagline.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND } from '../brand/fena';
import { FenaLogoMark } from '../components/brand';
import fieldGuide from '../theme/fieldGuide';
import { CompassDial, MonoMeta } from '../components/fieldguide';
import { useAuth } from '../hooks/useAuth';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

const HOLD_MS = 1200;

export default function SplashScreen({ navigation }) {
  const { user } = useAuth();
  const { onboarded } = useFirstLaunch();

  useEffect(() => {
    const t = setTimeout(() => {
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
        <FenaLogoMark width={156} />
        <Text style={styles.wordmark}>{BRAND.name}</Text>
        <MonoMeta size="eyebrow" style={styles.tag}>
          {BRAND.taglineShort}
        </MonoMeta>
      </View>

      <View style={styles.footer}>
        <MonoMeta size="tab" color={fieldGuide.creamFaint}>
          {`${BRAND.nameGeez} · FIELD GUIDE`}
        </MonoMeta>
      </View>
    </SafeAreaView>
  );
}

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
    opacity: 0.12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: 20,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 15,
    letterSpacing: 8,
    color: fieldGuide.ember,
    textAlign: 'center',
  },
  tag: {
    marginTop: 14,
    textAlign: 'center',
    letterSpacing: 3.2,
    color: fieldGuide.creamMute,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
