/**
 * AppStatusContext — global Field Guide states (offline, success sheet).
 *
 * Also re-exported from `src/navigation/FieldGuideStates.js`.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OfflineBanner from '../components/fieldguide/state/OfflineBanner';
import SuccessSheet from '../components/fieldguide/state/SuccessSheet';
import { useAuth } from '../hooks/useAuth';
import { networkEvents } from '../utils/networkEvents';
import { subscribeNetInfo } from '../utils/safeNetInfo';
import { showToast } from '../utils/toastBus';

const AppStatusContext = createContext(null);

const defaultSuccess = {
  visible: false,
  title: 'In your pocket.',
  body: '',
  perimeterText: 'SAVED · STAMP NO. 042 · ',
  onDismiss: null,
};

export function AppStatusProvider({ children }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [netConnected, setNetConnected] = useState(true);
  const [axiosOffline, setAxiosOffline] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [success, setSuccess] = useState(defaultSuccess);

  useEffect(() => {
    const unsubAxios = networkEvents.subscribe(() => {
      setAxiosOffline(networkEvents.getAxiosOffline());
    });

    const unsubNet = subscribeNetInfo((state) => {
      const connected =
        state.isConnected != null
          ? state.isConnected && state.isInternetReachable !== false
          : true;
      setNetConnected(connected);
      if (connected) {
        setAxiosOffline(false);
        networkEvents.setOffline(false);
        setLastSyncAt(new Date());
      }
    });

    return () => {
      unsubNet();
      unsubAxios();
    };
  }, []);

  const isOffline = !netConnected || axiosOffline;

  const showSuccessSheet = useCallback(
    ({ title, body, perimeterText, onDismiss } = {}) => {
      setSuccess({
        visible: true,
        title: title || defaultSuccess.title,
        body: body || defaultSuccess.body,
        perimeterText: perimeterText || defaultSuccess.perimeterText,
        onDismiss: onDismiss || null,
      });
    },
    [],
  );

  const dismissSuccessSheet = useCallback(() => {
    setSuccess((prev) => {
      prev.onDismiss?.();
      return { ...defaultSuccess, visible: false };
    });
  }, []);

  const showErrorScreen = useCallback(({ code } = {}) => {
    const label = code ? `Return to sender · ${code}` : 'Return to sender · try again';
    showToast(label, { variant: 'error' });
  }, []);

  const value = useMemo(
    () => ({
      isOffline,
      lastSyncAt,
      showSuccessSheet,
      dismissSuccessSheet,
      showErrorScreen,
    }),
    [
      isOffline,
      lastSyncAt,
      showSuccessSheet,
      dismissSuccessSheet,
      showErrorScreen,
    ],
  );

  return (
    <AppStatusContext.Provider value={value}>
      {children}
      {user && isOffline ? (
        <View
          pointerEvents="none"
          style={[styles.offlineWrap, { top: insets.top + 4 }]}
        >
          <OfflineBanner mode="banner" lastSyncAt={lastSyncAt} />
        </View>
      ) : null}
      <SuccessSheet
        visible={success.visible}
        title={success.title}
        body={success.body}
        perimeterText={success.perimeterText}
        onDismiss={dismissSuccessSheet}
      />
    </AppStatusContext.Provider>
  );
}

export function useAppStatus() {
  const ctx = useContext(AppStatusContext);
  if (!ctx) {
    throw new Error('useAppStatus must be used within AppStatusProvider');
  }
  return ctx;
}

/** NetInfo + axios offline signal combined. */
export function useOffline() {
  return useAppStatus().isOffline;
}

const styles = StyleSheet.create({
  offlineWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
