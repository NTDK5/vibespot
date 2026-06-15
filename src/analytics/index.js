import { Events } from './events';

let client = null;

export function setPostHogClient(posthog) {
  client = posthog ?? null;
}

export function isAnalyticsEnabled() {
  return Boolean(client) && Boolean(process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim());
}

export function track(event, properties = {}) {
  if (!client) return;
  try {
    client.capture(event, properties);
  } catch {
    /* non-fatal */
  }
}

export function screen(screenName, properties = {}) {
  track('screen_viewed', {
    screen_name: screenName,
    ...properties,
  });
}

export { Events };
