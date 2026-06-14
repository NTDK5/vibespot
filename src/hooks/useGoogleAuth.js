/**
 * useGoogleAuth — shared Google OAuth wiring for Login and Register.
 *
 * Passes an explicit redirectUri so dev-client builds never fall back to
 * exp+fena:// or com.fena.app:// (which trigger Google's custom-scheme error).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';

import { useAuth } from './useAuth';
import { googleNativeRedirectUri } from '../utils/googleAuth';
import { logger } from '../utils/logger';

const PLACEHOLDER_IDS = new Set([
  'YOUR_WEB_CLIENT_ID',
  'your-web-client-id.apps.googleusercontent.com',
]);

function stripEnvQuotes(value) {
  return String(value || '').trim().replace(/^"|"$/g, '');
}

function resolveGoogleClientId() {
  const id = stripEnvQuotes(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
  if (!id || PLACEHOLDER_IDS.has(id)) return null;
  return id;
}

export function useGoogleAuth({ onError } = {}) {
  const { loginWithGoogle } = useAuth();
  const [busyGoogle, setBusyGoogle] = useState(false);
  const webClientId = resolveGoogleClientId();
  const isConfigured = !!webClientId;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const androidClientId = stripEnvQuotes(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ) || undefined;
  const iosClientId = stripEnvQuotes(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ||
    undefined;

  const redirectUri = useMemo(
    () =>
      Platform.select({
        android: googleNativeRedirectUri(androidClientId),
        ios: googleNativeRedirectUri(iosClientId),
        default: undefined,
      }),
    [androidClientId, iosClientId],
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId,
    androidClientId,
    webClientId: webClientId || undefined,
    redirectUri,
  });

  useEffect(() => {
    if (__DEV__ && redirectUri) {
      logger.info({ message: 'GoogleAuth.redirectUri', metadata: { redirectUri } });
    }
  }, [redirectUri]);

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
      const detail =
        response.error?.message ||
        response.params?.error_description ||
        response.params?.error ||
        'Google sign-in was cancelled or failed.';
      onErrorRef.current?.(detail);
    }
  }, [response, handleIdToken]);

  const signInWithGoogle = useCallback(() => {
    if (!isConfigured) {
      onErrorRef.current?.(
        'Google Sign-In is not configured. Add client IDs to .env — see GOOGLE_SIGNIN_SETUP.md.',
      );
      return;
    }
    if (Platform.OS === 'android') {
      if (!androidClientId) {
        onErrorRef.current?.(
          'Android Google client ID is missing. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env.',
        );
        return;
      }
      if (!redirectUri) {
        onErrorRef.current?.('Could not build Google redirect URI from Android client ID.');
        return;
      }
    }
    if (Platform.OS === 'ios' && !iosClientId) {
      onErrorRef.current?.(
        'iOS Google client ID is missing. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env.',
      );
      return;
    }
    if (!request) {
      onErrorRef.current?.('Google Sign-In is still loading. Try again in a moment.');
      return;
    }
    if (__DEV__) {
      logger.info({
        message: 'GoogleAuth.prompt',
        metadata: {
          redirectUri: request.redirectUri,
          clientId: request.clientId,
        },
      });
    }
    promptAsync();
  }, [
    isConfigured,
    androidClientId,
    iosClientId,
    redirectUri,
    request,
    promptAsync,
  ]);

  return { request, busyGoogle, signInWithGoogle, isConfigured };
}

export default useGoogleAuth;
