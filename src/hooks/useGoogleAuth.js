/**
 * useGoogleAuth — shared Google OAuth wiring for Login and Register.
 *
 * Wraps expo-auth-session's Google id-token flow + AuthContext.loginWithGoogle
 * so both screens stay in sync. Uses the redirect scheme "fena" (see app.json)
 * and reads client IDs from EXPO_PUBLIC_GOOGLE_* env vars.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

import { useAuth } from './useAuth';

export function useGoogleAuth({ onError } = {}) {
  const { loginWithGoogle } = useAuth();
  const [busyGoogle, setBusyGoogle] = useState(false);

  // Keep the latest onError without re-subscribing the response effect.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || undefined,
    redirectUri: makeRedirectUri({ scheme: 'fena' }),
  });

  const handleIdToken = useCallback(
    async (idToken) => {
      if (!idToken) return;
      setBusyGoogle(true);
      const { error } = await loginWithGoogle(idToken);
      setBusyGoogle(false);
      if (error) onErrorRef.current?.(error);
    },
    [loginWithGoogle],
  );

  useEffect(() => {
    if (response?.type === 'success') {
      handleIdToken(response.params?.id_token);
    } else if (response?.type === 'error') {
      onErrorRef.current?.('Google sign-in was cancelled or failed.');
    }
  }, [response, handleIdToken]);

  const signInWithGoogle = useCallback(() => {
    if (!request) return;
    promptAsync();
  }, [request, promptAsync]);

  return { request, busyGoogle, signInWithGoogle };
}

export default useGoogleAuth;
