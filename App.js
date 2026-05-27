import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/components/ToastProvider";
import { AppStatusProvider } from './src/context/AppStatusContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFieldGuideFonts } from "./src/theme/fonts";

// Keep the native splash visible while the Field Guide fonts resolve.
// Wrapped in catch() because hot-reload can race the call and reject.
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min cache
      refetchOnWindowFocus: false,
    },
  },
})



export default function App() {
  const [fontsLoaded, fontError] = useFieldGuideFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // already hidden / not available — no-op
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
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
    </GestureHandlerRootView>
  );
}
