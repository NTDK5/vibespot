import React, { useEffect } from 'react';
import { PostHogProvider, usePostHog } from 'posthog-react-native';

import { setPostHogClient } from './index';
import { useAuth } from '../hooks/useAuth';

const POSTHOG_KEY = (process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '').trim();
const POSTHOG_HOST = (
  process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
).trim();

const enableInDev =
  process.env.EXPO_PUBLIC_POSTHOG_ENABLE_DEV === 'true';

function AnalyticsBridge() {
  const posthog = usePostHog();

  useEffect(() => {
    setPostHogClient(posthog ?? null);
    return () => setPostHogClient(null);
  }, [posthog]);

  return null;
}

function AnalyticsAuthSync() {
  const { user } = useAuth();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    if (user?.id) {
      posthog.identify(String(user.id), {
        name: user.name || undefined,
        home_city: user.homeCity || undefined,
        role: user.role || undefined,
      });
    } else {
      posthog.reset();
    }
  }, [posthog, user?.id, user?.name, user?.homeCity, user?.role]);

  return null;
}

export function AnalyticsProvider({ children }) {
  if (!POSTHOG_KEY) {
    return children;
  }

  return (
<PostHogProvider
  apiKey={POSTHOG_KEY}
  autocapture={{ captureScreens: false }}
  options={{ host: POSTHOG_HOST, captureAppLifecycleEvents: true, ... }}
>
      <AnalyticsBridge />
      {children}
    </PostHogProvider>
  );
}

export function AnalyticsAuthBinder() {
  if (!POSTHOG_KEY) return null;
  return <AnalyticsAuthSync />;
}

export default AnalyticsProvider;
