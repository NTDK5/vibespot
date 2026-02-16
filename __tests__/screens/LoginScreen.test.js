import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/LoginScreen';

// Mocks
const mockLoginWithGoogle = jest.fn();
const mockPromptAsync = jest.fn();

jest.mock('../../src/hooks/useAuth', () => ({
    useAuth: () => ({
        login: jest.fn(),
        loginWithGoogle: mockLoginWithGoogle,
    }),
}));

jest.mock('../../src/context/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            primary: '#000',
            text: '#000',
            surface: '#fff',
        },
    }),
}));

jest.mock('expo-auth-session/providers/google', () => ({
    useIdTokenAuthRequest: () => [
        {}, // request
        null, // response
        mockPromptAsync, // promptAsync
    ],
}));

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }) => <>{children}</>,
}));

describe('LoginScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        expect(getByText('Welcome to VibeSpot')).toBeTruthy();
        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
        expect(getByText('Sign in with Google')).toBeTruthy();
    });

    it('should initiate Google sign-in when button is pressed', async () => {
        const { getByText } = render(<LoginScreen />);

        const googleButton = getByText('Sign in with Google');
        fireEvent.press(googleButton);

        await waitFor(() => {
            expect(mockPromptAsync).toHaveBeenCalled();
        });
    });
});
