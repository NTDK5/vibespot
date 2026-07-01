import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { useAuth } from './useAuth';
import { track, Events } from '../analytics';
import { navigateFromPush, navigationRef } from '../navigation/navigationRef';
import { logger } from '../utils/logger';
import {
  registerPushToken,
  unregisterPushToken,
} from '../services/pushTokens.service';
import {
  ensureAndroidNotificationChannel,
  getExpoPushToken,
  getPushPlatform,
  parseNotificationData,
  requestPushPermissions,
} from '../services/pushNotifications.service';

// Routes where a pending/stale notification must NOT hijack navigation.
const AUTH_FLOW_ROUTES = new Set([
  'Splash',
  'Onboarding',
  'SignIn',
  'Register',
  'ForgotPassword',
  'VerifyEmail',
]);

function userPushOptIn(user) {
  const prefs = user?.preferences ?? {};
  if (prefs.pushNotifications === false) return false;
  return true;
}

function shouldIgnorePushNavigation({ didLoginThisSession, authLoading }) {
  if (authLoading) return true;
  if (didLoginThisSession) return true;
  if (!navigationRef.isReady()) return true;
  const routeName = navigationRef.getCurrentRoute()?.name;
  if (routeName && AUTH_FLOW_ROUTES.has(routeName)) return true;
  return false;
}

function navigateForPushPayload(data) {
  if (data.spotId) {
    navigateFromPush('SpotDetail', { spotId: data.spotId });
    return;
  }
  navigateFromPush('Notifications');
}

/**
 * Registers Expo push token when authenticated + permission granted.
 * Handles notification tap deep links.
 */
export function usePushNotifications() {
  const { user, loading: authLoading, didLoginThisSession } = useAuth();
  const tokenRef = useRef(null);
  const userIdRef = useRef(null);
  const handledColdStartRef = useRef(false);
  const didLoginRef = useRef(didLoginThisSession);
  const authLoadingRef = useRef(authLoading);

  didLoginRef.current = didLoginThisSession;
  authLoadingRef.current = authLoading;

  // Live notification taps while the app is running.
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (
          shouldIgnorePushNavigation({
            didLoginThisSession: didLoginRef.current,
            authLoading: authLoadingRef.current,
          })
        ) {
          return;
        }

        const data = parseNotificationData(response);
        track(Events.NOTIFICATION_OPENED, {
          type: data.type,
          spot_id: data.spotId,
          notification_id: data.notificationId,
        });
        navigateForPushPayload(data);
      },
    );

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      /* foreground — handler shows banner */
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, []);

  // Clear stale "last tapped notification" as soon as an active login starts,
  // before user state is persisted (prevents race with cold-start handler).
  useEffect(() => {
    if (!didLoginThisSession) return;
    handledColdStartRef.current = true;
    Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
  }, [didLoginThisSession]);

  // Cold-start: only for session restore — not after an active sign-in.
  useEffect(() => {
    if (!user?.id || authLoading || handledColdStartRef.current) return;

    if (didLoginThisSession) {
      handledColdStartRef.current = true;
      Notifications.clearLastNotificationResponseAsync?.();
      return;
    }

    if (shouldIgnorePushNavigation({ didLoginThisSession, authLoading })) return;

    let cancelled = false;
    (async () => {
      const response = await Notifications.getLastNotificationResponseAsync().catch(
        () => null,
      );
      if (cancelled || !response || handledColdStartRef.current) return;

      // Re-check after async gap — login may have completed while we awaited.
      if (
        shouldIgnorePushNavigation({
          didLoginThisSession: didLoginRef.current,
          authLoading: authLoadingRef.current,
        })
      ) {
        await Notifications.clearLastNotificationResponseAsync?.();
        return;
      }

      handledColdStartRef.current = true;
      const data = parseNotificationData(response);
      track(Events.NOTIFICATION_OPENED, {
        type: data.type,
        spot_id: data.spotId,
        notification_id: data.notificationId,
        cold_start: true,
      });
      navigateForPushPayload(data);
      await Notifications.clearLastNotificationResponseAsync?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, didLoginThisSession]);

  // Reset cold-start latch on logout so the next restored session can deep-link.
  useEffect(() => {
    if (!user?.id) {
      handledColdStartRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user?.id) {
        if (tokenRef.current) {
          await unregisterPushToken(tokenRef.current);
          tokenRef.current = null;
        }
        userIdRef.current = null;
        return;
      }

      if (!userPushOptIn(user)) {
        return;
      }

      if (userIdRef.current === user.id && tokenRef.current) {
        return;
      }

      await ensureAndroidNotificationChannel();

      const permission = await requestPushPermissions();
      track(Events.PUSH_PERMISSION_RESULT, {
        granted: permission.granted,
        status: permission.status || permission.reason,
      });

      if (!permission.granted || cancelled) return;

      const token = await getExpoPushToken();
      if (!token || cancelled) return;

      const platform = getPushPlatform();
      const result = await registerPushToken(token, platform);
      if (result.error) {
        logger.error({
          service: 'push',
          action: 'register_token_failed',
          message: result.error,
        });
        return;
      }

      tokenRef.current = token;
      userIdRef.current = user.id;
      track(Events.PUSH_TOKEN_REGISTERED, { platform });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.preferences]);

  return null;
}
