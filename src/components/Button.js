import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

/**
 * Reusable Button Component
 */
export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const buttonStyle = [
    styles.button,
    variant === 'primary' && { backgroundColor: theme.primary },
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && { backgroundColor: theme.error },
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && { color: theme.primary },
    variant === 'danger' && styles.dangerText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.primary} />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

function createStyles(fieldGuide) {

  return StyleSheet.create({
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: fieldGuide.ember,
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryText: {
      color: '#fff',
    },
    dangerText: {
      color: '#fff',
    },
    disabledText: {
      opacity: 0.7,
    },
  });
}
