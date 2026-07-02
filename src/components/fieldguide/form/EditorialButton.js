/**
 * EditorialButton — pill-shaped action button in 4 variants.
 *
 * CSS ref: .btn / .btn-primary / .btn-cream / .btn-ghost / .btn-block /
 * .btn-sm (css_app.css L277-317). The spec opts to use the sans family
 * (Inter 600) rather than mono — matches the CSS `font-family: var(--sans)`
 * declaration.
 *
 * Props:
 *   children: string
 *   onPress: () => void
 *   variant?: 'primary' | 'cream' | 'ghost' | 'danger'   default 'primary'
 *   size?: 'md' | 'sm'                                    default 'md'
 *   block?: boolean                                       width 100%
 *   leading?: ReactNode                                   icon at the left
 *   trailing?: ReactNode                                  icon at the right
 *   loading?: boolean                                     replaces label with spinner
 *   disabled?: boolean
 *   accessibilityLabel?: string
 *   style?: ViewStyle
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

function getVariants(fieldGuide) {

  return {
    primary: {
      bg: fieldGuide.ember,
      color: fieldGuide.onEmber,
      border: 'transparent',
    },
    cream: {
      bg: fieldGuide.creamFill,
      color: fieldGuide.onCreamFill,
      border: 'transparent',
    },
    ghost: {
      bg: 'transparent',
      color: fieldGuide.text,
      border: fieldGuide.inkLine2,
    },
    danger: {
      bg: fieldGuide.rose,
      color: fieldGuide.onEmber,
      border: 'transparent',
    },
  };
}

const SIZES = {
  md: { py: 15, px: 22, fs: 14 },
  sm: { py: 10, px: 14, fs: 12 },
};

export default function EditorialButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  block = false,
  leading,
  trailing,
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const variants = getVariants(fieldGuide);
  const v = variants[variant] || variants.primary;
  const s = SIZES[size] || SIZES.md;
  const isInert = disabled || loading;

  return (
    <Pressable
      onPress={isInert ? undefined : onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: isInert, busy: loading }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          width: block ? '100%' : undefined,
          opacity: isInert ? 0.55 : pressed ? 0.92 : 1,
          // Always pass an array — toggling between [{scale}] and
          // undefined triggers a "Cannot read property 'forEach' of
          // null" in RN's _validateTransforms on Android.
          transform: [{ scale: pressed && !isInert ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.color} />
      ) : (
        <View style={styles.inner}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text
            style={[
              styles.label,
              { color: v.color, fontSize: s.fs },
            ]}
            numberOfLines={1}
          >
            {children}
          </Text>
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  base: {
    borderRadius: fieldGuide.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fieldGuide.fonts.sansSemi,
    letterSpacing: 0.02 * 14,
    includeFontPadding: false,
  },
  leading: {
    marginRight: 8,
  },
  trailing: {
    marginLeft: 8,
  },
});
}
