import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '../hooks/useAuth';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

/**
 * Hides the native expo splash once local auth + onboarding flags are ready.
 * authLoading is storage-only (does not wait on /user/me).
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
