import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isInServiceArea } from '../config/serviceArea';
import { useLocation } from './useLocation';

const BANNER_DISMISSED_KEY = 'fena.serviceArea.bannerDismissed';

export function useServiceArea() {
  const { location, loading: locationLoading } = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
        if (!cancelled) setBannerDismissed(value === 'true');
      } catch {
        if (!cancelled) setBannerDismissed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inServiceArea = useMemo(() => {
    if (!location) return null;
    return isInServiceArea(location.latitude, location.longitude);
  }, [location]);

  const dismissBanner = useCallback(async () => {
    setBannerDismissed(true);
    try {
      await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      /* non-fatal */
    }
  }, []);

  const showBanner =
    inServiceArea === false && bannerDismissed === false;

  return {
    location,
    locationLoading,
    inServiceArea,
    bannerDismissed,
    showBanner,
    dismissBanner,
  };
}
