/**
 * FloatingLabelInput — mono label above a DM Sans text input with a
 * hairline underline that switches to ember on focus and rose on error.
 *
 * CSS ref: .field / .field-label / .field input (css_app.css L362-400)
 *
 * Controlled component.
 *
 * Props:
 *   label: string
 *   value: string
 *   onChangeText: (v: string) => void
 *   placeholder?: string             faint mono-style hint
 *   error?: string                   rose underline + rose mono caption
 *   multiline?: boolean
 *   keyboardType?, autoCapitalize?, secureTextEntry?, autoCorrect?,
 *   autoComplete?, returnKeyType?, onSubmitEditing?, onBlur?, onFocus?
 *   style?: ViewStyle
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import fieldGuide from '../../../theme/fieldGuide';
import MonoMeta from '../primitives/MonoMeta';

export default function FloatingLabelInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  autoCorrect,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  onBlur,
  onFocus,
  style,
  inputStyle,
}) {
  const [focused, setFocused] = useState(false);

  const underlineColor = error
    ? fieldGuide.rose
    : focused
      ? fieldGuide.ember
      : fieldGuide.inkLine2;

  return (
    <View style={[styles.field, style]}>
      <MonoMeta size="eyebrow">{label}</MonoMeta>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={fieldGuide.creamFaint}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
        multiline={multiline}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          {
            borderBottomColor: underlineColor,
          },
          inputStyle,
        ]}
      />
      {error ? (
        <Text style={styles.error}>{String(error).toUpperCase()}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'column',
  },
  input: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 18,
    color: fieldGuide.cream,
    width: '100%',
    includeFontPadding: false,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 6,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    textTransform: 'uppercase',
    color: fieldGuide.rose,
    includeFontPadding: false,
  },
});
