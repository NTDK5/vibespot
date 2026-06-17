import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '../hooks/useAuth';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

/**
 * Hides the native expo splash once auth restore + onboarding flag are ready.
 * Branded SplashScreen takes over inside NavigationContainer.
 */
export default function NativeSplashController() {
  const { loading: authLoading } = useAuth();
  const { ready: launchReady } = useFirstLaunch();

  useEffect(() => {
    if (authLoading || !launchReady) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [authLoading, launchReady]);

  return null;
}
