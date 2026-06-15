import { usePushNotifications } from '../hooks/usePushNotifications';

/** Mount inside AuthProvider to wire Expo push when the user is signed in. */
export default function PushNotificationsBootstrap() {
  usePushNotifications();
  return null;
}
