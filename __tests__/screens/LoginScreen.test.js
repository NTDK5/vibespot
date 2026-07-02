import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { BRAND } from '../../src/brand/fena';

const mockLoginWithGoogle = jest.fn();
const mockPromptAsync = jest.fn();

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    loginWithGoogle: mockLoginWithGoogle,
  }),
}));

jest.mock('../../src/context/ThemeContext', () => {
  const { buildFieldGuide, buildLegacyTheme } = require('../../src/theme/fieldGuideThemes');
  const fieldGuide = buildFieldGuide(true);
  return {
    useTheme: () => ({
      theme: buildLegacyTheme(fieldGuide, true),
      fieldGuide,
      isDark: true,
      preference: 'dark',
      setPreference: jest.fn(),
    }),
  };
});

jest.mock('../../src/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    busyGoogle: false,
    signInWithGoogle: mockPromptAsync,
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <>{children}</>,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('LoginScreen', () => {
  const navigation = {
    canGoBack: jest.fn(() => false),
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign-in copy and FENA footer', () => {
    const { getByText, getByLabelText } = render(<LoginScreen navigation={navigation} />);

    expect(getByText('Welcome back.')).toBeTruthy();
    expect(getByText(new RegExp(`New to ${BRAND.name}`))).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
    expect(getByText('Continue with Google')).toBeTruthy();
    expect(getByLabelText(BRAND.logoA11yLabel)).toBeTruthy();
  });

  it('initiates Google sign-in when button is pressed', async () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockPromptAsync).toHaveBeenCalled();
    });
  });
});
