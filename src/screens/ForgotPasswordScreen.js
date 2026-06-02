/**
 * ForgotPasswordScreen — Field Guide "lost your way back in?" screen.
 *
 * Source: screens/05-forgot-password.html. Calls AuthContext.requestReset
 * and surfaces errors via Toast. The endpoint /auth/forgot-password may
 * not exist on the backend yet — the helper handles that gracefully.
 */

import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AuthKeyboardScroll, {
  useAuthFieldScroll,
} from '../components/auth/AuthKeyboardScroll';
import fieldGuide from '../theme/fieldGuide';
import {
  DisplayTitle,
  EditorialButton,
  FloatingLabelInput,
  MonoMeta,
  TopBar,
} from '../components/fieldguide';

import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { isValidEmail } from '../utils/helpers';

import { BRAND } from '../brand/fena';

function ForgotPasswordScreenForm({ navigation }) {
  const { requestReset, resetPassword } = useAuth();
  const toast = useToast();
  const { registerField, scrollToField } = useAuthFieldScroll();

  // 'request' = enter email; 'reset' = enter code + new password
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submitRequest = async () => {
    if (!email.trim()) {
      toast?.show?.('Drop your email above.', { variant: 'error' });
      return;
    }
    if (!isValidEmail(email.trim())) {
      toast?.show?.('That doesn\'t look like an email.', { variant: 'error' });
      return;
    }
    setBusy(true);
    const { ok, error } = await requestReset(email.trim().toLowerCase());
    setBusy(false);
    if (ok) {
      toast?.show?.('Check your inbox for a 6-digit code.', { variant: 'success' });
      setStep('reset');
    } else {
      toast?.show?.(error || 'Could not send reset code.', { variant: 'error' });
    }
  };

  const submitReset = async () => {
    if (code.trim().length !== 6) {
      toast?.show?.('Enter the 6-digit code from your email.', { variant: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      toast?.show?.('Password must be at least 6 characters.', { variant: 'error' });
      return;
    }
    setBusy(true);
    const { ok, error } = await resetPassword(
      email.trim().toLowerCase(),
      code.trim(),
      newPassword,
    );
    setBusy(false);
    if (ok) {
      toast?.show?.('Password updated. Sign in with your new password.', {
        variant: 'success',
      });
      navigation.navigate('SignIn');
    } else {
      toast?.show?.(error || 'Could not reset password.', { variant: 'error' });
    }
  };

  const submit = step === 'request' ? submitRequest : submitReset;

  const openMail = () => {
    Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => {
      toast?.show?.('No mail app available.', { variant: 'error' });
    });
  };

  return (
    <>
      <TopBar
        transparent
        left="back"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.body}>
            <View style={styles.head}>
              <MonoMeta size="eyebrow" style={styles.eyebrow}>
                Reset
              </MonoMeta>
              <DisplayTitle size="lg">
                {step === 'request' ? 'Lost your way back in?' : 'Set a new password.'}
              </DisplayTitle>
              <Text style={styles.lede}>
                {step === 'request'
                  ? "Drop your email. We'll send you a one-time code to set a new password."
                  : `Enter the 6-digit code we sent to ${email.trim().toLowerCase()} and choose a new password.`}
              </Text>
            </View>

            {step === 'request' ? (
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
                    returnKeyType="send"
                    onSubmitEditing={submit}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View ref={registerField('code')} collapsable={false}>
                  <FloatingLabelInput
                    label="6-digit code"
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                    onFocus={scrollToField('code')}
                    placeholder="123456"
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    returnKeyType="next"
                  />
                </View>
                <View ref={registerField('newPassword')} collapsable={false}>
                  <FloatingLabelInput
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    onFocus={scrollToField('newPassword')}
                    placeholder="Make it a good one"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                    returnKeyType="send"
                    onSubmitEditing={submit}
                  />
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <EditorialButton
                variant="primary"
                block
                loading={busy}
                onPress={submit}
              >
                {step === 'request' ? 'Send reset code' : 'Update password'}
              </EditorialButton>
              {step === 'reset' ? (
                <EditorialButton
                  variant="ghost"
                  block
                  onPress={() => setStep('request')}
                >
                  Use a different email
                </EditorialButton>
              ) : null}
            </View>

            <View style={styles.helpCard}>
              <View style={styles.helpRow}>
                <View style={styles.pmMini}>
                  <Text style={styles.pmSpark}>✦</Text>
                </View>
                <View style={styles.helpBody}>
                  <Text style={styles.helpTitle}>Need a real person?</Text>
                  <Text style={styles.helpText}>
                    Write the editors directly at{' '}
                    <Text
                      onPress={openMail}
                      style={styles.helpMail}
                      accessibilityRole="link"
                    >
                      {BRAND.supportEmail}
                    </Text>
                    {' '}— we usually reply within a day.
                  </Text>
                </View>
              </View>
            </View>
      </View>
    </>
  );
}

function ForgotPasswordScreen({ navigation }) {
  return (
    <AuthKeyboardScroll>
      <ForgotPasswordScreenForm navigation={navigation} />
    </AuthKeyboardScroll>
  );
}

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  head: {
    marginBottom: 36,
  },
  eyebrow: {
    marginBottom: 14,
  },
  lede: {
    marginTop: 14,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
    maxWidth: 300,
  },
  form: {
    marginBottom: 28,
  },
  actions: {
    marginBottom: 24,
    gap: 12,
  },
  helpCard: {
    marginTop: 'auto',
    padding: 18,
    borderRadius: fieldGuide.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.inkElev,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pmMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pmSpark: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 18,
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
  helpBody: {
    flex: 1,
  },
  helpTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
    marginBottom: 4,
    includeFontPadding: false,
  },
  helpText: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: fieldGuide.creamMute,
  },
  helpMail: {
    color: fieldGuide.cream,
  },
});
