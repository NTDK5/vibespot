import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  buildFieldGuide,
  buildFgType,
  buildLegacyTheme,
} from '../theme/fieldGuideThemes';
import {
  DEFAULT_APPEARANCE,
  getAppearancePreference,
  setAppearancePreference,
} from '../utils/appearancePrefs';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAppearancePreference().then((saved) => {
      if (mounted) {
        setPreferenceState(saved);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isDark = useMemo(() => {
    if (preference === 'system') return systemScheme !== 'light';
    return preference === 'dark';
  }, [preference, systemScheme]);

  const fieldGuide = useMemo(() => buildFieldGuide(isDark), [isDark]);
  const fgType = useMemo(() => buildFgType(fieldGuide), [fieldGuide]);
  const theme = useMemo(() => buildLegacyTheme(fieldGuide, isDark), [fieldGuide, isDark]);

  const setPreference = useCallback(async (next) => {
    const saved = await setAppearancePreference(next);
    setPreferenceState(saved);
    return saved;
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(isDark ? 'light' : 'dark');
  }, [isDark, setPreference]);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      isDark,
      fieldGuide,
      fgType,
      theme,
      toggleTheme,
      ready,
    }),
    [preference, setPreference, isDark, fieldGuide, fgType, theme, toggleTheme, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

export default ThemeContext;
