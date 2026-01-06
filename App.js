import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "./src/lib/queryClient";



export default function App() {
  return (
    <>
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
      </QueryClientProvider>
      </GestureHandlerRootView>
    </>
  );
}
