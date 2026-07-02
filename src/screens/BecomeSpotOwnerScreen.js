/**
 * BecomeSpotOwnerScreen — apply to list a venue on FENA.
 */

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import EditorialButton from '../components/fieldguide/form/EditorialButton';
import FloatingLabelInput from '../components/fieldguide/form/FloatingLabelInput';
import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { applySpotOwner } from '../services/ownerSpots.service';

export default function BecomeSpotOwnerScreen({ navigation }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const toast = useToast();
  const { isSpotOwner, isSpotOwnerPending } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSpotOwner) {
      toast.show('You already have spot owner access.', { variant: 'info' });
      navigation.goBack();
    }
  }, [isSpotOwner, navigation, toast]);

  async function onSubmit() {
    setBusy(true);
    try {
      const { error } = await applySpotOwner({
        businessName: businessName.trim() || undefined,
        message: message.trim() || undefined,
      });
      if (error) throw new Error(error);
      toast.show('Application sent — we\'ll review it soon.', { variant: 'success' });
      navigation.goBack();
    } catch (err) {
      toast.show(err.message || 'Could not submit application.', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  if (isSpotOwnerPending) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={fieldGuide.cream} />
          </Pressable>
          <MonoMeta size="kicker">LIST YOUR SPOT</MonoMeta>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.pendingWrap}>
          <MonoMeta size="spot">APPLICATION UNDER REVIEW</MonoMeta>
          <Text style={styles.pendingText}>
            We&apos;re reviewing your spot owner application. You&apos;ll hear from us soon.
          </Text>
          <EditorialButton variant="ghost" block onPress={() => navigation.goBack()}>
            Back to profile
          </EditorialButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={fieldGuide.cream} />
          </Pressable>
          <MonoMeta size="kicker">LIST YOUR SPOT</MonoMeta>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Join the field guide</Text>
          <Text style={styles.lede}>
            Tell us about your venue. Once approved, you can add spots from the app — each listing
            goes through a quick review before going live.
          </Text>

          <FloatingLabelInput
            label="Business or venue name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Rooftop Addis"
          />

          <Text style={styles.label}>Why FENA?</Text>
          <TextInput
            style={styles.textarea}
            value={message}
            onChangeText={setMessage}
            placeholder="A few lines about your space, neighborhood, or what explorers should know…"
            placeholderTextColor={fieldGuide.creamMute}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <EditorialButton variant="primary" block disabled={busy} onPress={onSubmit}>
            {busy ? 'Sending…' : 'Submit application'}
          </EditorialButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: fieldGuide.ink },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  pendingWrap: {
    flex: 1,
    padding: 20,
    gap: 16,
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 14,
    lineHeight: 21,
    color: fieldGuide.creamMute,
  },
  title: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 28,
    color: fieldGuide.cream,
    marginBottom: 4,
  },
  lede: {
    fontSize: 14,
    lineHeight: 21,
    color: fieldGuide.creamMute,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: fieldGuide.creamMute,
    fontFamily: fieldGuide.fonts.monoMed,
    letterSpacing: 0.6,
    marginTop: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: fieldGuide.inkLine,
    borderRadius: 8,
    padding: 14,
    minHeight: 120,
    color: fieldGuide.cream,
    fontSize: 15,
    backgroundColor: fieldGuide.inkElev,
  },
});
}
