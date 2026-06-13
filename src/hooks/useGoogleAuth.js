/**
 * useGoogleAuth — shared Google OAuth wiring for Login and Register.
 *
 * Native Android/iOS builds use Google's reversed client ID redirect URI.
 * See GOOGLE_SIGNIN_SETUP.md and src/utils/googleAuth.js.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';

import { useAuth } from './useAuth';
import { googleNativeRedirectUri } from '../utils/googleAuth';

const PLACEHOLDER_IDS = new Set([
  'YOUR_WEB_CLIENT_ID',
  'your-web-client-id.apps.googleusercontent.com',
]);

function resolveGoogleClientId() {
  const id = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!id || PLACEHOLDER_IDS.has(id)) return null;
  return id;
}

export function useGoogleAuth({ onError } = {}) {
  const { loginWithGoogle } = useAuth();
  const [busyGoogle, setBusyGoogle] = useState(false);
  const webClientId = resolveGoogleClientId();
  const isConfigured = !!webClientId;

  // Keep the latest onError without re-subscribing the response effect.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim().replace(/^"|"$/g, '') ||
    undefined;
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim().replace(/^"|"$/g, '') ||
    undefined;

  const redirectUriOptions = useMemo(() => {
    const native = Platform.select({
      android: googleNativeRedirectUri(androidClientId),
      ios: googleNativeRedirectUri(iosClientId),
      default: undefined,
    });
    return native ? { native } : {};
  }, [androidClientId, iosClientId]);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      iosClientId,
      androidClientId,
      webClientId: webClientId || undefined,
    },
    redirectUriOptions,
  );

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
    if (!isConfigured) {
      onErrorRef.current?.(
        'Google Sign-In is not configured. Add client IDs to .env — see GOOGLE_SIGNIN_SETUP.md.',
      );
      return;
    }
    if (Platform.OS === 'android' && !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      onErrorRef.current?.(
        'Android Google client ID is missing. Create an Android OAuth client in Google Cloud Console and set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env.',
      );
      return;
    }
    if (Platform.OS === 'ios' && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
      onErrorRef.current?.(
        'iOS Google client ID is missing. Create an iOS OAuth client in Google Cloud Console and set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env.',
      );
      return;
    }
    if (!request) {
      onErrorRef.current?.('Google Sign-In is still loading. Try again in a moment.');
      return;
    }
    promptAsync();
  }, [isConfigured, request, promptAsync]);

  return { request, busyGoogle, signInWithGoogle, isConfigured };
}

export default useGoogleAuth;
