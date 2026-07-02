/**
 * TopBar — editorial top navigation strip.
 *
 * CSS ref: .topbar / .topbar-icon (css_app.css L202-228) and the hero
 * floating overlay in screens/13-spot-detail.html L23-42 (used when
 * `transparent` is set).
 *
 * Props:
 *   title?: string                                Syne 700 / 22 / -0.01em
 *   left?: 'back' | 'close' | ReactNode           icon button
 *   right?: ReactNode | ReactNode[]               one or more icon buttons
 *   transparent?: boolean                         no background / hero overlay
 *   onLeftPress?: () => void                      shorthand for the back/close presets
 *   style?: ViewStyle
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

function IconButton({ name, onPress, transparent, styles, fieldGuide }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          borderColor: fieldGuide.inkLine,
          backgroundColor: transparent ? fieldGuide.overlay : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={name} size={18} color={transparent ? fieldGuide.onDark : fieldGuide.text} />
    </Pressable>
  );
}

function renderLeft(left, onLeftPress, transparent, styles, fieldGuide) {
  if (left == null) return <View style={styles.slot} />;
  if (left === 'back') {
    return (
      <IconButton
        name="chevron-back"
        onPress={onLeftPress}
        transparent={transparent}
        styles={styles}
        fieldGuide={fieldGuide}
      />
    );
  }
  if (left === 'close') {
    return (
      <IconButton
        name="close"
        onPress={onLeftPress}
        transparent={transparent}
        styles={styles}
        fieldGuide={fieldGuide}
      />
    );
  }
  return <View style={styles.slot}>{left}</View>;
}

function renderRight(right, styles) {
  if (right == null) return <View style={styles.slot} />;
  const arr = Array.isArray(right) ? right : [right];
  return (
    <View style={styles.rightRow}>
      {arr.map((node, i) => (
        <View key={i} style={i > 0 ? styles.rightGap : null}>{node}</View>
      ))}
    </View>
  );
}

export default function TopBar({
  title,
  left,
  right,
  transparent = false,
  onLeftPress,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top,
          backgroundColor: transparent ? 'transparent' : fieldGuide.ink,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {renderLeft(left, onLeftPress, transparent, styles, fieldGuide)}
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.titleSpacer} />
        )}
        {renderRight(right, styles)}
      </View>
    </View>
  );
}

// Expose the icon button so callers can drop one into `right` without
// re-implementing the border + hit area.
TopBar.IconButton = IconButton;

function createStyles(fieldGuide) {
  return StyleSheet.create({
  bar: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    minHeight: 56,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    letterSpacing: -0.01 * 22,
    color: fieldGuide.text,
    includeFontPadding: false,
  },
  titleSpacer: {
    flex: 1,
  },
  slot: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightGap: {
    marginLeft: 8,
  },
});
}
