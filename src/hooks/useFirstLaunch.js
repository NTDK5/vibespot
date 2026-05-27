/**
 * useFirstLaunch — tracks whether the user has seen the onboarding flow.
 *
 * Persists a single boolean under the AsyncStorage key
 * `vibespot.onboarded`. Returns `{ ready, onboarded, markOnboarded }`.
 *
 *   - `ready`        false until AsyncStorage has been read once; gate
 *                    your navigator on this to avoid a flash of the
 *                    wrong screen.
 *   - `onboarded`    true once the user has completed onboarding.
 *   - `markOnboarded()` async — sets the flag and updates state.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vibespot.onboarded';

export function useFirstLaunch() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (cancelled) return;
        setOnboarded(v === '1');
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setOnboarded(false);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markOnboarded = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage failure is non-fatal — we still update local state so
      // the in-session flow can continue. On the next cold start the
      // user will see onboarding again.
    }
    setOnboarded(true);
  }, []);

  return { ready, onboarded, markOnboarded };
}

export default useFirstLaunch;
