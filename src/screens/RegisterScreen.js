/**
 * RegisterScreen — Field Guide signup.
 *
 * Source: screens/04-signup.html. Replaces the legacy Login-style
 * scrollable card with a clean ink form. Calls AuthContext.register
 * which persists the session and, if the backend reports
 * `emailVerified === false`, stashes the email so this screen can
 * redirect to VerifyEmail.
 */

import React, { useMemo, useState } from 'react';
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

import { BRAND } from '../brand/fena';
import { FenaAuthBrandHeader } from '../components/brand';
import GoogleIcon from '../components/GoogleIcon';
import fieldGuide from '../theme/fieldGuide';
import {
  DisplayTitle,
  EditorialButton,
  FloatingLabelInput,
  MonoMeta,
  TopBar,
} from '../components/fieldguide';

import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useToast } from '../components/ToastProvider';
import { isValidEmail } from '../utils/helpers';

function CheckBox({ checked, onToggle }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.checkBox,
        checked
          ? { backgroundColor: fieldGuide.ember, borderColor: fieldGuide.ember }
          : { borderColor: fieldGuide.inkLine2 },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {checked ? <Ionicons name="checkmark" size={12} color="#FFF8F1" /> : null}
    </Pressable>
  );
}

function RegisterScreenForm({ navigation }) {
  const { register, pendingVerificationEmail } = useAuth();
  const toast = useToast();
  const { registerField, scrollToField } = useAuthFieldScroll();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const showError = (msg) => toast?.show?.(msg, { variant: 'error' });
  const showInfo = (msg) => toast?.show?.(msg, { variant: 'info' });

  const { busyGoogle, signInWithGoogle } = useGoogleAuth({
    onError: showError,
  });

  const allFilled = useMemo(
    () =>
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      homeCity.trim().length > 0,
    [name, email, password, homeCity],
  );

  const canSubmit = allFilled && agreed && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    const { error } = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      homeCity: homeCity.trim(),
    });
    setBusy(false);

    if (error) {
      showError(error);
      return;
    }

    // If the backend says the email needs verification, jump there.
    // Otherwise AppNavigator picks up the new user automatically and
    // switches stacks.
    if (pendingVerificationEmail) {
      navigation.replace('VerifyEmail');
    }
  };

  return (
    <>
      <TopBar
        transparent
        left="back"
        onLeftPress={() => navigation.goBack()}
        style={styles.topbar}
      />

      <View style={styles.body}>
            <View style={styles.logoWrap}>
              <FenaAuthBrandHeader markWidth={120} />
            </View>
            <View style={styles.head}>
              <MonoMeta size="eyebrow" style={styles.eyebrow}>
                {`NEW EXPLORER · ${BRAND.name}`}
              </MonoMeta>
              <DisplayTitle size="lg" italic="field guide.">
                Start your field guide.
              </DisplayTitle>
              <Text style={styles.lede}>
                A few quick details and you're collecting spots.
              </Text>
            </View>

            <View style={styles.form}>
              <View ref={registerField('name')} collapsable={false}>
                <FloatingLabelInput
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  onFocus={scrollToField('name')}
                  placeholder="What should we call you"
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>
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
                  placeholder="Make it a good one"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  returnKeyType="next"
                />
              </View>
              <View ref={registerField('homeCity')} collapsable={false}>
                <FloatingLabelInput
                  label="Home City"
                  value={homeCity}
                  onChangeText={setHomeCity}
                  onFocus={scrollToField('homeCity')}
                  placeholder="Addis Ababa"
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            </View>

            <Pressable
              onPress={() => setAgreed((a) => !a)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              hitSlop={6}
              style={styles.termsRow}
            >
              <CheckBox checked={agreed} onToggle={() => setAgreed((a) => !a)} />
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => showInfo('Community Guidelines — coming soon.')}
                >
                  Community Guidelines
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => showInfo('Privacy — coming soon.')}
                >
                  Privacy
                </Text>
                . No spam, no selling data — promise.
              </Text>
            </Pressable>

            <View style={styles.actions}>
              <EditorialButton
                variant="primary"
                block
                disabled={!canSubmit}
                loading={busy}
                onPress={handleSubmit}
              >
                Create my guide
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
            >
              Continue with Google
            </EditorialButton>

            <Pressable
              onPress={() => navigation.navigate('SignIn')}
              accessibilityRole="link"
              hitSlop={8}
              style={styles.footerLinkWrap}
            >
              <Text style={styles.footerText}>
                Already exploring?  <Text style={styles.footerEmber}>Sign in</Text>
              </Text>
            </Pressable>
      </View>
    </>
  );
}

function RegisterScreen({ navigation }) {
  return (
    <AuthKeyboardScroll>
      <RegisterScreenForm navigation={navigation} />
    </AuthKeyboardScroll>
  );
}

export default RegisterScreen;

const styles = StyleSheet.create({
  topbar: {
    marginBottom: 0,
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  head: {
    marginBottom: 28,
  },
  eyebrow: {
    marginBottom: 14,
  },
  lede: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    lineHeight: 21,
    color: fieldGuide.creamSoft,
    maxWidth: 320,
  },
  form: {
    flexDirection: 'column',
    gap: 20,
  },
  termsRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    lineHeight: 18.6,
    color: fieldGuide.creamSoft,
  },
  termsLink: {
    color: fieldGuide.ember,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.widest(11),
    textTransform: 'uppercase',
  },
  actions: {
    marginTop: 22,
    marginBottom: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
  },
  dividerLabel: {
    marginHorizontal: 12,
    color: fieldGuide.creamMute,
  },
  footerLinkWrap: {
    marginTop: 'auto',
    paddingTop: 18,
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
