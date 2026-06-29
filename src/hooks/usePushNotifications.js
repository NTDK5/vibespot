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
// Mirrors AuthNavigationSync so cold-start push handling never fires while
// the user is still in the auth flow (e.g. right after Google sign-in).
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
  const { user, didLoginThisSession } = useAuth();
  const tokenRef = useRef(null);
  const userIdRef = useRef(null);
  const handledColdStartRef = useRef(false);

  // Live notification taps while the app is running.
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
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

  // Cold-start: only act on a notification the user actually opened to launch
  // the app — and only once they're authenticated and past the auth flow.
  // This prevents a stale last-tapped notification from hijacking navigation
  // (e.g. landing on Notifications right after Google sign-in).
  useEffect(() => {
    if (!user?.id || handledColdStartRef.current) return;

    // An active sign-in this session must always land on the normal
    // post-login screen (Home). Never replay a stale tapped notification,
    // and clear it so it can't fire on a later remount.
    if (didLoginThisSession) {
      handledColdStartRef.current = true;
      Notifications.clearLastNotificationResponseAsync?.();
      return;
    }

    if (!navigationRef.isReady()) return;

    const routeName = navigationRef.getCurrentRoute()?.name;
    if (routeName && AUTH_FLOW_ROUTES.has(routeName)) return;

    let cancelled = false;
    (async () => {
      const response = await Notifications.getLastNotificationResponseAsync().catch(
        () => null,
      );
      if (cancelled || !response || handledColdStartRef.current) return;

      handledColdStartRef.current = true;
      const data = parseNotificationData(response);
      track(Events.NOTIFICATION_OPENED, {
        type: data.type,
        spot_id: data.spotId,
        notification_id: data.notificationId,
        cold_start: true,
      });
      navigateForPushPayload(data);
      // Clear so it can't re-trigger on a later login/remount.
      await Notifications.clearLastNotificationResponseAsync?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, didLoginThisSession]);

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
