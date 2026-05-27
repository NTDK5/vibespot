/**
 * SpotWizardShell — Add Spot 6-step wizard chrome.
 *
 * CSS ref: .topbar-add + .progress + .footer-cta (screens/17-add-spot.html).
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from './EditorialButton';

function padStep(n) {
  return String(n).padStart(2, '0');
}

export default function SpotWizardShell({
  stepIndex = 0,
  totalSteps = 6,
  onClose,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  backHidden = false,
  continueDisabled = false,
  submitting = false,
  stepKicker,
  stepTitle,
  stepSubtitle,
  children,
}) {
  const insets = useSafeAreaInsets();
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.fill}>
        <View style={styles.topbar}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="close" size={14} color={fieldGuide.cream} />
          </Pressable>
          <Text style={styles.topTitle}>Submit a spot</Text>
          <Text style={styles.stepCounter}>
            <Text style={styles.stepCounterBold}>{padStep(stepIndex + 1)}</Text>
            {` / ${padStep(totalSteps)}`}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 56}
        >
          <ScrollView
            style={styles.fill}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepHeader}>
              {stepKicker ? (
                <MonoMeta size="eyebrow" style={styles.kicker}>
                  {stepKicker}
                </MonoMeta>
              ) : null}
              {stepTitle ? (
                <DisplayTitle size="lg" weight="400" style={styles.headline}>
                  {stepTitle}
                </DisplayTitle>
              ) : null}
              {stepSubtitle ? (
                <Text style={styles.subtitle}>{stepSubtitle}</Text>
              ) : null}
            </View>
            <View style={styles.form}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 8) + 8 },
          ]}
        >
          {!backHidden ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [
                styles.backPill,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={12}
                color={fieldGuide.creamMute}
              />
              <Text style={styles.backPillText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <EditorialButton
            variant="primary"
            block
            onPress={onContinue}
            disabled={continueDisabled}
            loading={submitting}
            style={styles.continueBtn}
          >
            {continueLabel}
          </EditorialButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  fill: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 18,
    includeFontPadding: false,
  },
  stepCounter: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  stepCounterBold: {
    fontFamily: fieldGuide.fonts.monoMed,
    color: fieldGuide.cream,
  },
  progressTrack: {
    height: 2,
    backgroundColor: fieldGuide.inkLine,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: fieldGuide.ember,
  },
  scroll: {
    paddingBottom: 24,
  },
  stepHeader: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
  },
  kicker: {
    color: fieldGuide.ember,
  },
  headline: {
    marginTop: 6,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: fieldGuide.creamSoft,
    maxWidth: 280,
  },
  form: {
    paddingHorizontal: 22,
    paddingBottom: 8,
    gap: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.ink,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  backPillText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  backPlaceholder: {
    width: 88,
  },
  continueBtn: {
    flex: 1,
  },
});
