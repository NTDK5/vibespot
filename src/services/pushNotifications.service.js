import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { logger } from '../utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function resolveProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

export async function requestPushPermissions() {
  if (!Device.isDevice) {
    return { granted: false, reason: 'simulator' };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return {
    granted: finalStatus === 'granted',
    status: finalStatus,
  };
}

export async function getExpoPushToken() {
  if (!Device.isDevice) return null;

  const projectId = resolveProjectId();
  if (!projectId) {
    logger.warn({
      service: 'push',
      action: 'missing_project_id',
      message: 'EAS projectId missing — cannot get Expo push token',
    });
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse?.data ?? null;
}

export function getPushPlatform() {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'FENA',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E8743A',
  });
}

export function parseNotificationData(response) {
  const content = response?.notification?.request?.content;
  const data = content?.data ?? {};
  return {
    type: data.type ? String(data.type) : 'default',
    spotId: data.spotId ? String(data.spotId) : null,
    notificationId: data.notificationId ? String(data.notificationId) : null,
    title: content?.title ?? null,
    body: content?.body ?? null,
  };
}
