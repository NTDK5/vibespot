/**
 * Safe NetInfo wrapper — never loads @react-native-community/netinfo unless
 * the native module is present (avoids RNCNetInfo is null crash in dev
 * clients that weren't rebuilt after installing the package).
 */

import { NativeModules } from 'react-native';

export function isNetInfoNativeAvailable() {
  return !!NativeModules.RNCNetInfo;
}

/**
 * Subscribe to connectivity changes when native NetInfo exists.
 * @param {(state: { isConnected?: boolean | null, isInternetReachable?: boolean | null }) => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeNetInfo(onChange) {
  if (!isNetInfoNativeAvailable()) {
    return () => {};
  }

  try {
    // Only require after native check — the package throws on import otherwise.
    const NetInfo = require('@react-native-community/netinfo').default;

    const apply = (state) => {
      onChange(state);
    };

    const unsub = NetInfo.addEventListener(apply);
    NetInfo.fetch().then(apply).catch(() => {});

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  } catch {
    return () => {};
  }
}
