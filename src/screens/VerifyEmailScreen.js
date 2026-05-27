/**
 * VerifyEmailScreen — Field Guide 6-digit OTP screen.
 *
 * Source: screens/06-verify-email.html. Reads
 * `pendingVerificationEmail` from AuthContext and lets the user enter
 * a 6-digit code. Auto-submits on the sixth digit. Has a 60s resend
 * countdown that flips into a tappable "Resend" link in ember.
 *
 * The visible boxes are dumb views; the actual input is a single
 * hidden TextInput so the system keyboard + autofill behave correctly
 * on both iOS and Android.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import fieldGuide from '../theme/fieldGuide';
import {
  DisplayTitle,
  EditorialButton,
  MonoMeta,
  TopBar,
} from '../components/fieldguide';

import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';

const SLOTS = 6;
const RESEND_SECONDS = 60;

function formatCountdown(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function VerifyEmailScreen({ navigation }) {
  const {
    pendingVerificationEmail,
    setPendingVerificationEmail,
    verifyEmail,
    resendVerification,
  } = useAuth();
  const toast = useToast();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  // Countdown tick — pauses naturally when the screen unmounts.
  useEffect(() => {
    if (remaining <= 0) return undefined;
    const t = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Open the keyboard immediately when the screen mounts.
  useEffect(() => {
    const t = setTimeout(focusInput, 250);
    return () => clearTimeout(t);
  }, [focusInput]);

  const submit = useCallback(
    async (codeArg) => {
      const value = (codeArg ?? code).trim();
      if (value.length !== SLOTS) {
        toast?.show?.('Enter all six digits.', { variant: 'error' });
        return;
      }
      setBusy(true);
      const { ok, error } = await verifyEmail(value);
      setBusy(false);
      if (ok) {
        toast?.show?.('Verified. Welcome aboard.', { variant: 'success' });
        // AppNavigator handles where to go next based on user/emailVerified.
      } else {
        setCode('');
        toast?.show?.(error || 'Verification failed.', { variant: 'error' });
      }
    },
    [code, verifyEmail, toast],
  );

  const handleChange = useCallback(
    (text) => {
      const digits = text.replace(/\D/g, '').slice(0, SLOTS);
      setCode(digits);
      if (digits.length === SLOTS) {
        submit(digits);
      }
    },
    [submit],
  );

  const handleResend = useCallback(async () => {
    if (remaining > 0) return;
    setRemaining(RESEND_SECONDS);
    const { ok, error } = await resendVerification();
    if (ok) {
      toast?.show?.('Code re-sent.', { variant: 'success' });
    } else {
      toast?.show?.(error || 'Could not resend.', { variant: 'error' });
    }
  }, [remaining, resendVerification, toast]);

  const handleUseDifferent = useCallback(() => {
    setPendingVerificationEmail(null);
    navigation.navigate('Register');
  }, [navigation, setPendingVerificationEmail]);

  const slots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < SLOTS; i++) {
      arr.push({
        char: code[i] || '',
        active: i === code.length, // next-to-fill slot is the "active" one
      });
    }
    return arr;
  }, [code]);

  const emailLabel = pendingVerificationEmail || 'your inbox';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TopBar
          transparent
          left="back"
          onLeftPress={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <View style={styles.head}>
            <MonoMeta size="eyebrow" style={styles.eyebrow}>
              Verify · Step 03
            </MonoMeta>
            <DisplayTitle size="lg">Check your inbox.</DisplayTitle>
            <Text style={styles.lede}>
              We sent a six-digit key to{' '}
              <Text style={styles.ledeStrong}>{emailLabel}</Text>. It expires
              in 10 minutes.
            </Text>
          </View>

          <Pressable
            onPress={focusInput}
            accessibilityRole="button"
            accessibilityLabel="Enter verification code"
            style={styles.otpRow}
          >
            {slots.map((slot, i) => {
              const isEmpty = slot.char === '';
              const isActive = slot.active && !busy;
              return (
                <View
                  key={i}
                  style={[
                    styles.slot,
                    isActive ? styles.slotActive : null,
                  ]}
                >
                  {isEmpty ? (
                    <View style={styles.slotDash} />
                  ) : (
                    <Text style={styles.slotChar}>{slot.char}</Text>
                  )}
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={SLOTS}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            caretHidden
            style={styles.hiddenInput}
            accessibilityLabel="Six digit verification code"
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>DIDN'T GET IT?</Text>
            {remaining > 0 ? (
              <Text style={styles.resendMuted}>
                {`RESEND IN ${formatCountdown(remaining)}`}
              </Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={10} accessibilityRole="button">
                <Text style={styles.resendActive}>RESEND</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.actions}>
            <EditorialButton
              variant="primary"
              block
              loading={busy}
              onPress={() => submit()}
            >
              Verify
            </EditorialButton>
            <EditorialButton
              variant="ghost"
              block
              onPress={handleUseDifferent}
            >
              Use a different email
            </EditorialButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default VerifyEmailScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  flex: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
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
  ledeStrong: {
    color: fieldGuide.cream,
    fontFamily: fieldGuide.fonts.sansSemi,
  },
  otpRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  slot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActive: {
    borderColor: fieldGuide.ember,
    // ember glow analog
    shadowColor: fieldGuide.ember,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  slotChar: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 32,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  slotDash: {
    width: 8,
    height: 1.5,
    backgroundColor: fieldGuide.creamFaint,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    top: 0,
    left: 0,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  resendLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  resendMuted: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  resendActive: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
  actions: {
    marginTop: 'auto',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 6,
  },
});
