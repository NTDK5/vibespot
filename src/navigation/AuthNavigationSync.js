import { useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';
import { navigationRef } from './navigationRef';

const AUTH_FLOW_ROUTES = new Set([
  'Splash',
  'Onboarding',
  'SignIn',
  'Register',
  'ForgotPassword',
  'VerifyEmail',
]);

/**
 * Keeps navigation aligned with session changes after login/logout.
 * Cold-start routing is handled by SplashScreen.
 */
export default function AuthNavigationSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !navigationRef.isReady()) return;

    const route = navigationRef.getCurrentRoute();
    const routeName = route?.name;
    if (!routeName || routeName === 'Splash') return;

    if (user && AUTH_FLOW_ROUTES.has(routeName)) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      });
      return;
    }

    if (!user && !AUTH_FLOW_ROUTES.has(routeName)) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    }
  }, [user, loading]);

  return null;
}
