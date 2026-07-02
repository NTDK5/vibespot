/**
 * ChangePasswordSheet — account password change (extracted from legacy Profile).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import SheetHandle from '../primitives/SheetHandle';
import MonoMeta from '../primitives/MonoMeta';
import DisplayTitle from '../primitives/DisplayTitle';
import FloatingLabelInput from '../form/FloatingLabelInput';
import EditorialButton from '../form/EditorialButton';
import { changePassword } from '../../../services/auth.service';

const SHEET_HEIGHT = 420;
const ANIM_MS = 220;

export default function ChangePasswordSheet({ visible, onClose }) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIM_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: ANIM_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible, translateY, backdrop]);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully.');
      onClose?.();
    } catch (error) {
      const message =
        error?.message || error?.error || 'Failed to change password.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.flex} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      </Pressable>
      <KeyboardAvoidingView
        style={styles.flexEnd}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY }],
            },
          ]}
        >
          <SheetHandle />
          <MonoMeta size="eyebrow" style={styles.kicker}>
            Account
          </MonoMeta>
          <DisplayTitle size="md" style={styles.title}>
            Change password
          </DisplayTitle>

          <View style={styles.fields}>
            <FloatingLabelInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <FloatingLabelInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <FloatingLabelInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <EditorialButton block loading={loading} onPress={handleSubmit}>
            Update password
          </EditorialButton>
          <EditorialButton
            variant="ghost"
            block
            onPress={onClose}
            style={styles.cancelBtn}
          >
            Cancel
          </EditorialButton>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  flex: { flex: 1 },
  flexEnd: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,9,12,0.72)',
  },
  sheet: {
    backgroundColor: fieldGuide.inkElev,
    borderTopLeftRadius: fieldGuide.radius.lg,
    borderTopRightRadius: fieldGuide.radius.lg,
    paddingHorizontal: 22,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  kicker: { marginTop: 8 },
  title: { marginTop: 6, marginBottom: 16 },
  fields: { gap: 4, marginBottom: 20 },
  cancelBtn: { marginTop: 8 },
});
}
