import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { useAuth } from './useAuth';
import { track, Events } from '../analytics';
import { navigateFromPush } from '../navigation/navigationRef';
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
  const { user } = useAuth();
  const tokenRef = useRef(null);
  const userIdRef = useRef(null);

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

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = parseNotificationData(response);
      track(Events.NOTIFICATION_OPENED, {
        type: data.type,
        spot_id: data.spotId,
        notification_id: data.notificationId,
        cold_start: true,
      });
      navigateForPushPayload(data);
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, []);

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
