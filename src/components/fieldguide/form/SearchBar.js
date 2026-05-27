/**
 * SearchBar — full-width search input on inkElev background.
 *
 * CSS ref: .search-bar (css_app.css L402-428) and the Map screen's
 * glassy override (`.map-top .search-bar`, screens/09-map.html L29).
 *
 * Props:
 *   value: string
 *   onChangeText: (v: string) => void
 *   placeholder?: string
 *   onSubmit?: () => void
 *   trailing?: ReactNode               icon at the right (mic, filter, etc.)
 *   surface?: 'elev' | 'glass'         default 'elev'. 'glass' wraps in
 *                                       BlurView with a translucent ink fill.
 *   autoFocus?: boolean
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onSubmit,
  trailing,
  surface = 'elev',
  autoFocus,
  style,
}) {
  const isGlass = surface === 'glass';

  const content = (
    <>
      <Ionicons name="search" size={16} color={fieldGuide.creamMute} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={fieldGuide.creamMute}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        style={styles.input}
      />
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (isGlass) {
    return (
      <BlurView
        tint="dark"
        intensity={28}
        style={[styles.bar, styles.glass, style]}
      >
        {content}
      </BlurView>
    );
  }

  return (
    <View style={[styles.bar, styles.elev, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    overflow: 'hidden',
  },
  elev: {
    backgroundColor: fieldGuide.inkElev,
  },
  glass: {
    backgroundColor: 'rgba(20,22,29,0.78)',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.cream,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  trailing: {
    marginLeft: 10,
  },
});
