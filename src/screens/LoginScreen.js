/**
 * LoginScreen (route name: SignIn) — Field Guide auth.
 *
 * Source: screens/03-signin.html. Restyle of the legacy login screen.
 * Preserves the Google OAuth wiring (expo-auth-session/Google) and
 * the existing useAuth().login flow — only chrome/visual layout was
 * rebuilt with fieldguide components.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthKeyboardScroll, {
  useAuthFieldScroll,
} from '../components/auth/AuthKeyboardScroll';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import {
  DisplayTitle,
  EditorialButton,
  FloatingLabelInput,
  MonoMeta,
  TopBar,
} from '../components/fieldguide';

import { BRAND } from '../brand/fena';
import { FenaAuthBrandHeader } from '../components/brand';
import GoogleIcon from '../components/GoogleIcon';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useToast } from '../components/ToastProvider';
import { isValidEmail } from '../utils/helpers';

function LoginScreenForm({ navigation }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { login } = useAuth();
  const toast = useToast();
  const { registerField, scrollToField } = useAuthFieldScroll();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);

  const showError = (msg) => {
    if (toast?.show) {
      toast.show(msg, { variant: 'error' });
    }
  };

  const { busyGoogle, signInWithGoogle } = useGoogleAuth({
    onError: showError,
  });

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
    <>
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
              <FenaAuthBrandHeader markWidth={132} />
            </View>
            <View style={styles.head}>
              <MonoMeta size="eyebrow" style={styles.eyebrow}>
                Returning Explorer
              </MonoMeta>
              <DisplayTitle size="xl" italic="back.">
                Welcome back.
              </DisplayTitle>
              <Text style={styles.lede}>
                Pick up where you left off — your saved spots are waiting.
              </Text>
            </View>

            <View style={styles.form}>
              <View ref={registerField('email')} collapsable={false}>
                <FloatingLabelInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={scrollToField('email')}
                  placeholder="you@somewhere.co"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View ref={registerField('password')} collapsable={false}>
                <FloatingLabelInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={scrollToField('password')}
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
              onPress={signInWithGoogle}
              leading={<GoogleIcon />}
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
    </>
  );
}

function LoginScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  return (
    <AuthKeyboardScroll contentContainerStyle={styles.scroll}>
      <LoginScreenForm navigation={navigation} />
    </AuthKeyboardScroll>
  );
}

export default LoginScreen;

function createStyles(fieldGuide) {
  return StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingTop: 48,
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
}
