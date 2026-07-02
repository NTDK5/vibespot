import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

export default function ThemedStatusBar() {
  const { fieldGuide } = useTheme();
  return <StatusBar style={fieldGuide.statusBar === 'light' ? 'light' : 'dark'} />;
}
