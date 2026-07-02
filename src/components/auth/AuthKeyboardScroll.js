/**
 * AuthKeyboardScroll — shared keyboard-safe scroll shell for auth screens.
 *
 * - SafeAreaView top edge only (keyboard owns the bottom inset)
 * - KeyboardAvoidingView with behavior="padding" on iOS and Android
 * - keyboardVerticalOffset from useSafeAreaInsets().top
 * - ScrollView paddingBottom: insets.bottom + 280 so lower fields can scroll clear
 * - Field focus scroll via measureLayout + refs + delayed scrollTo
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const SCROLL_MARGIN = 120;
const KEYBOARD_SCROLL_DELAY_MS = Platform.OS === 'android' ? 150 : 100;
const KEYBOARD_EXTRA_PAD = 280;

const AuthScrollContext = createContext(null);

export function useAuthFieldScroll() {
  const ctx = useContext(AuthScrollContext);
  if (!ctx) {
    throw new Error('useAuthFieldScroll must be used within AuthKeyboardScroll');
  }
  return ctx;
}

export default function AuthKeyboardScroll({
  children,
  contentContainerStyle,
  style,
}) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const fieldRefs = useRef({});

  const registerField = useCallback((key) => {
    return (node) => {
      if (node) {
        fieldRefs.current[key] = node;
      } else {
        delete fieldRefs.current[key];
      }
    };
  }, []);

  const scrollToField = useCallback((key) => {
    return () => {
      const fieldNode = fieldRefs.current[key];
      const contentNode = contentRef.current;

      if (!fieldNode || !contentNode) return;

      const runMeasure = () => {
        fieldNode.measureLayout(
          contentNode,
          (_x, y) => {
            scrollRef.current?.scrollTo?.({
              y: Math.max(0, y - SCROLL_MARGIN),
              animated: true,
            });
          },
          () => {},
        );
      };

      // Wait for the keyboard animation before measuring layout.
      setTimeout(runMeasure, KEYBOARD_SCROLL_DELAY_MS);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ registerField, scrollToField }),
    [registerField, scrollToField],
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + KEYBOARD_EXTRA_PAD },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View ref={contentRef} collapsable={false} style={styles.content}>
            <AuthScrollContext.Provider value={contextValue}>
              {children}
            </AuthScrollContext.Provider>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
  },
});
}
