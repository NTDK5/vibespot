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

import { BRAND } from '../brand/fena';
import { FenaLogoLockup } from '../components/brand';
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

// Phase-2 placeholder. Real value will come from a user-count endpoint
// in a future phase.
const ISSUE_NUMBER = '029';

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

function RegisterScreen({ navigation }) {
  const { register, pendingVerificationEmail } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const showError = (msg) => toast?.show?.(msg, { variant: 'error' });
  const showInfo = (msg) => toast?.show?.(msg, { variant: 'info' });

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            transparent
            left="back"
            onLeftPress={() => navigation.goBack()}
            style={styles.topbar}
          />

          <View style={styles.body}>
            <View style={styles.logoWrap}>
              <FenaLogoLockup width={220} />
            </View>
            <View style={styles.head}>
              <MonoMeta size="eyebrow" style={styles.eyebrow}>
                {`NEW READER · ${BRAND.name}`}
              </MonoMeta>
              <DisplayTitle size="lg" italic="field guide.">
                Start your field guide.
              </DisplayTitle>
              <Text style={styles.lede}>
                A few quick details and you're collecting spots.
              </Text>
            </View>

            <View style={styles.form}>
              <FloatingLabelInput
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="What should we call you"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
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
              <FloatingLabelInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Make it a good one"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="next"
              />
              <FloatingLabelInput
                label="Home City"
                value={homeCity}
                onChangeText={setHomeCity}
                placeholder="So we can show you nearby spots"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
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
                  onPress={() => showInfo('Reader\'s Pact — coming soon.')}
                >
                  Reader's Pact
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

            <Pressable
              onPress={() => navigation.navigate('SignIn')}
              accessibilityRole="link"
              hitSlop={8}
              style={styles.footerLinkWrap}
            >
              <Text style={styles.footerText}>
                Already a reader?  <Text style={styles.footerEmber}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default RegisterScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingBottom: 12,
  },
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
