const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Adds an intent-filter for Google's reversed Android client ID scheme so
 * OAuth can redirect back into the app after sign-in.
 */
function withGoogleAuthScheme(config) {
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.replace(/^"|"$/g, '') ||
    '';
  const prefix = androidClientId.replace('.apps.googleusercontent.com', '');
  if (!prefix) return config;

  const scheme = `com.googleusercontent.apps.${prefix}`;

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application?.[0];
    const activity = app?.activity?.find(
      (a) => a.$?.['android:name'] === '.MainActivity',
    );
    if (!activity) return cfg;

    activity['intent-filter'] = activity['intent-filter'] || [];
    const exists = activity['intent-filter'].some((filter) =>
      filter.data?.some((d) => d.$?.['android:scheme'] === scheme),
    );
    if (!exists) {
      activity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        category: [
          { $: { 'android:name': 'android.intent.category.DEFAULT' } },
          { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
        ],
        data: [{ $: { 'android:scheme': scheme } }],
      });
    }
    return cfg;
  });
}

module.exports = withGoogleAuthScheme;
