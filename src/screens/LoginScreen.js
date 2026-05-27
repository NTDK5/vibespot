/**
 * LoginScreen (route name: SignIn) — Field Guide auth.
 *
 * Source: screens/03-signin.html. Restyle of the legacy login screen.
 * Preserves the Google OAuth wiring (expo-auth-session/Google) and
 * the existing useAuth().login flow — only chrome/visual layout was
 * rebuilt with fieldguide components.
 */

import React, { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import fieldGuide from '../theme/fieldGuide';
import {
  DisplayTitle,
  EditorialButton,
  FloatingLabelInput,
  MonoMeta,
  TopBar,
} from '../components/fieldguide';

import { BRAND } from '../brand/fena';
import { FenaLogoLockup } from '../components/brand';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { isValidEmail } from '../utils/helpers';

function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill={fieldGuide.cream}
        d="M21.35 11.1H12v3.9h5.42c-.24 1.3-1.7 3.8-5.42 3.8-3.27 0-5.93-2.7-5.93-6s2.66-6 5.93-6c1.86 0 3.1.79 3.81 1.47l2.6-2.5C16.86 4.13 14.65 3 12 3 6.92 3 2.8 7.12 2.8 12.2S6.92 21.4 12 21.4c6.94 0 11.5-4.86 11.5-11.7 0-.8-.08-1.4-.15-2z"
      />
    </Svg>
  );
}

function LoginScreen({ navigation }) {
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);

  // Google Auth Request — preserved from the legacy LoginScreen.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID',
    redirectUri: makeRedirectUri({ scheme: 'fena' }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const showError = (msg) => {
    if (toast?.show) {
      toast.show(msg, { variant: 'error' });
    }
  };

  const handleGoogleSignIn = async (idToken) => {
    setBusyGoogle(true);
    const { error } = await loginWithGoogle(idToken);
    setBusyGoogle(false);
    if (error) {
      showError(error);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      showError('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return;
    }
    setBusyEmail(true);
    const { error } = await login(email.trim().toLowerCase(), password);
    setBusyEmail(false);
    if (error) showError(error);
  };

  const canGoBack = !!navigation.canGoBack && navigation.canGoBack();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {canGoBack ? (
            <TopBar
              transparent
              left="back"
              onLeftPress={() => navigation.goBack()}
              style={styles.topbar}
            />
          ) : (
            <View style={styles.topbarSpacer} />
          )}

          <View style={styles.body}>
            <View style={styles.logoWrap}>
              <FenaLogoLockup width={240} />
            </View>
            <View style={styles.head}>
              <MonoMeta size="eyebrow" style={styles.eyebrow}>
                Returning Reader
              </MonoMeta>
              <DisplayTitle size="xl" italic="back.">
                Welcome back.
              </DisplayTitle>
              <Text style={styles.lede}>
                Pick up where you left off — your saved spots are waiting.
              </Text>
            </View>

            <View style={styles.form}>
              <FloatingLabelInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@somewhere.co"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
              />

              <View>
                <FloatingLabelInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType="go"
                  onSubmitEditing={handleEmailLogin}
                  inputStyle={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={fieldGuide.creamMute}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityRole="link"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.forgot,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={styles.forgotText}>FORGOT PASSWORD ↗</Text>
              </Pressable>
            </View>

            <View style={styles.actions}>
              <EditorialButton
                variant="primary"
                block
                loading={busyEmail}
                onPress={handleEmailLogin}
              >
                Sign in
              </EditorialButton>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <MonoMeta size="tab" style={styles.dividerLabel}>OR</MonoMeta>
              <View style={styles.dividerLine} />
            </View>

            <EditorialButton
              variant="ghost"
              block
              loading={busyGoogle}
              disabled={!request}
              onPress={() => promptAsync()}
              leading={<GoogleG />}
              style={styles.googleBtn}
            >
              Continue with Google
            </EditorialButton>

            <Pressable
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="link"
              hitSlop={8}
              style={styles.footerLinkWrap}
            >
              <Text style={styles.footerText}>
                {`New to ${BRAND.name}?  `}
                <Text style={styles.footerEmber}>Start your guide</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  topbar: {
    marginBottom: 8,
  },
  topbarSpacer: {
    height: 8,
  },
  body: {
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  head: {
    marginBottom: 36,
  },
  eyebrow: {
    marginBottom: 14,
  },
  lede: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
    maxWidth: 320,
  },
  form: {
    flexDirection: 'column',
    gap: 24,
  },
  passwordInput: {
    paddingRight: 32,
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    bottom: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
  actions: {
    marginTop: 28,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
  },
  dividerLabel: {
    marginHorizontal: 14,
  },
  googleBtn: {
    marginBottom: 8,
  },
  footerLinkWrap: {
    marginTop: 'auto',
    paddingTop: 22,
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },
  footerEmber: {
    color: fieldGuide.ember,
    fontFamily: fieldGuide.fonts.sansMedium,
  },
});
