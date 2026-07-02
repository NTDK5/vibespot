/**
 * SuccessSheet — bottom-sheet confirmation modal ("In your pocket").
 *
 * Source: screens/27-success.html. Big PostmarkStamp at the top with an
 * ember check; editorial title; supporting paragraph; cream Continue
 * button to dismiss. Slides up from the bottom over a darkened backdrop.
 *
 * Props:
 *   visible: boolean
 *   onDismiss: () => void
 *   title: string                          e.g. "In your pocket"
 *   italic?: string
 *   body?: string
 *   perimeterText?: string                 default "SAVED · STAMP NO. 042 · "
 *   ctaLabel?: string                      default "Continue"
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import DisplayTitle from '../primitives/DisplayTitle';
import EditorialButton from '../form/EditorialButton';
import PostmarkStamp from '../signature/PostmarkStamp';
import SheetHandle from '../primitives/SheetHandle';

export default function SuccessSheet({
  visible,
  onDismiss,
  title = 'In your pocket',
  italic,
  body = "Stamped to the field guide. Find it later under your saved spots.",
  perimeterText = 'SAVED · STAMP NO. 042 · ',
  ctaLabel = 'Continue',
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const translate = useSharedValue(visible ? 0 : 400);
  const backdrop = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    translate.value = withTiming(visible ? 0 : 400, {
      duration: visible ? 320 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
    backdrop.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 280 : 200,
    });
  }, [visible, translate, backdrop]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(11,12,17,0.62)' },
            backdropStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <SheetHandle color="rgba(20,22,29,0.22)" />

          <View style={styles.stampArea}>
            <PostmarkStamp
              perimeterText={perimeterText}
              size={130}
              color={fieldGuide.ember}
              ringStyle="double"
              center={
                <View style={styles.checkBubble}>
                  <Ionicons name="checkmark" size={28} color="#FFF8F1" />
                </View>
              }
            />
          </View>

          <DisplayTitle
            size="lg"
            italic={italic}
            color={fieldGuide.inkText}
            italicColor={fieldGuide.emberDeep}
            style={styles.title}
          >
            {title}
          </DisplayTitle>

          {body ? <Text style={styles.body}>{body}</Text> : null}

          <EditorialButton
            variant="primary"
            block
            onPress={onDismiss}
            style={styles.cta}
          >
            {ctaLabel}
          </EditorialButton>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: fieldGuide.paper,
    borderTopLeftRadius: fieldGuide.radius.xl,
    borderTopRightRadius: fieldGuide.radius.xl,
    paddingHorizontal: 28,
    paddingBottom: 34,
    paddingTop: 6,
    alignItems: 'center',
  },
  stampArea: {
    marginTop: 18,
    marginBottom: 22,
  },
  checkBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: fieldGuide.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: fieldGuide.inkText,
    maxWidth: 280,
  },
  body: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.textMute,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: {
    marginTop: 28,
    width: '100%',
    alignSelf: 'stretch',
  },
});
}
