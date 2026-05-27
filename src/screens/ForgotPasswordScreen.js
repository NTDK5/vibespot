/**
 * ForgotPasswordScreen — Field Guide "lost your way back in?" screen.
 *
 * Source: screens/05-forgot-password.html. Calls AuthContext.requestReset
 * and surfaces errors via Toast. The endpoint /auth/forgot-password may
 * not exist on the backend yet — the helper handles that gracefully.
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const EDITOR_EMAIL = 'readers@vibespot.co';

function ForgotPasswordScreen({ navigation }) {
  const { requestReset } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
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
      toast?.show?.('Check your inbox.', { variant: 'success' });
      navigation.goBack();
    } else {
      toast?.show?.(error || 'Could not send reset link.', { variant: 'error' });
    }
  };

  const openMail = () => {
    Linking.openURL(`mailto:${EDITOR_EMAIL}`).catch(() => {
      toast?.show?.('No mail app available.', { variant: 'error' });
    });
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
          />

          <View style={styles.body}>
            <View style={styles.head}>
              <MonoMeta size="eyebrow" style={styles.eyebrow}>
                Reset
              </MonoMeta>
              <DisplayTitle size="lg">Lost your way back in?</DisplayTitle>
              <Text style={styles.lede}>
                Drop your email. We'll send you a one-time link to set a new
                password.
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
                returnKeyType="send"
                onSubmitEditing={submit}
              />
            </View>

            <View style={styles.actions}>
              <EditorialButton
                variant="primary"
                block
                loading={busy}
                onPress={submit}
              >
                Send reset link
              </EditorialButton>
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
                      {EDITOR_EMAIL}
                    </Text>
                    {' '}— we usually reply within a day.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
  },
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
