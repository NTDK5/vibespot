import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/components/ToastProvider';
import { AppStatusProvider } from './src/context/AppStatusContext';
import PushNotificationsBootstrap from './src/components/PushNotificationsBootstrap';
import NativeSplashController from './src/components/NativeSplashController';
import ApiReadyWarmup from './src/components/ApiReadyWarmup';
import {
  AnalyticsProvider,
  AnalyticsAuthBinder,
} from './src/analytics/AnalyticsProvider';
import { useFieldGuideFonts } from './src/theme/fonts';

// Keep the native splash visible until auth + launch flags resolve.
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [fontsLoaded, fontError] = useFieldGuideFonts();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnalyticsProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AuthProvider>
              <NativeSplashController />
              <AnalyticsAuthBinder />
              <ApiReadyWarmup />
              <PushNotificationsBootstrap />
              <ThemeProvider>
                <ToastProvider>
                  <AppStatusProvider>
                    <StatusBar style="light" />
                    <AppNavigator />
                  </AppStatusProvider>
                </ToastProvider>
              </ThemeProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </AnalyticsProvider>
    </GestureHandlerRootView>
  );
}
