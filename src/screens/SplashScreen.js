/**
 * SplashScreen — FENA launch screen (every cold start).
 *
 * Waits for auth restore + onboarding flag, enforces a minimum hold,
 * then routes to Onboarding, SignIn, or MainTabs.
 */

import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND } from '../brand/fena';
import { FenaLogoMark } from '../components/brand';
import fieldGuide from '../theme/fieldGuide';
import { MonoMeta } from '../components/fieldguide';
import { useAuth } from '../hooks/useAuth';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

const HOLD_MS = 1200;

export default function SplashScreen({ navigation }) {
  const { user, loading: authLoading } = useAuth();
  const { ready: launchReady, onboarded } = useFirstLaunch();
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (authLoading || !launchReady) return;

    const delay = Math.max(0, HOLD_MS - (Date.now() - mountedAt.current));
    const t = setTimeout(() => {
      if (!onboarded) {
        navigation.replace('Onboarding');
      } else if (!user) {
        navigation.replace('SignIn');
      } else {
        navigation.replace('MainTabs');
      }
    }, delay);

    return () => clearTimeout(t);
  }, [authLoading, launchReady, onboarded, user, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <FenaLogoMark width={156} />
        <Text style={styles.wordmark}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
      </View>

      <View style={styles.footer}>
        <MonoMeta size="tab" color={fieldGuide.creamFaint}>
          {BRAND.splashFooter}
        </MonoMeta>
        <ActivityIndicator
          color={fieldGuide.ember}
          size="small"
          style={styles.loader}
        />
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
  tagline: {
    marginTop: 14,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
    textAlign: 'center',
    maxWidth: 280,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loader: {
    marginTop: 16,
  },
});
