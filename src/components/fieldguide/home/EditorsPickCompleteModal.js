/**
 * EditorsPickCompleteModal — Field Guide congrats for finishing the weekly challenge.
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';
import PostmarkStamp from '../signature/PostmarkStamp';
import { Ionicons } from '@expo/vector-icons';

export default function EditorsPickCompleteModal({
  visible,
  onDismiss,
  bonusXp = 50,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* optional native module */
      }
    })();
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.stampWrap}>
            <PostmarkStamp
              size={88}
              perimeterText="EDITOR'S PICK · THIS WEEK · CHALLENGE · "
              center={
                <Ionicons name="checkmark" size={28} color={fieldGuide.ember} />
              }
              color={fieldGuide.cream}
            />
          </View>

          <MonoMeta size="spot" style={styles.kicker}>
            CHALLENGE COMPLETE
          </MonoMeta>
          <DisplayTitle size="sm" style={styles.title}>
            All three stamps collected
          </DisplayTitle>

          <View style={styles.xpBlock}>
            <Text style={styles.xpAmount}>+{bonusXp} XP</Text>
            <MonoMeta size="spot" style={styles.xpMeta}>
              EDITOR'S PICK · THIS WEEK
            </MonoMeta>
          </View>

          <Text style={styles.body}>
            You visited every spot the editors picked this week. Nice field work.
          </Text>

          <EditorialButton onPress={onDismiss} style={styles.cta}>
            Continue
          </EditorialButton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: fieldGuide.inkElev,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  stampWrap: {
    marginBottom: 20,
  },
  kicker: {
    color: fieldGuide.ember,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    color: fieldGuide.cream,
    textAlign: 'center',
    marginBottom: 20,
  },
  xpBlock: {
    width: '100%',
    backgroundColor: 'rgba(232,116,58,0.12)',
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232,116,58,0.25)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  xpAmount: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 32,
    lineHeight: 36,
    color: fieldGuide.ember,
    marginBottom: 6,
  },
  xpMeta: {
    color: fieldGuide.emberSoft,
    textAlign: 'center',
  },
  body: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: fieldGuide.creamSoft,
    textAlign: 'center',
    marginBottom: 24,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
}
