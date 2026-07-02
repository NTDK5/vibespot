import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';

// Mocks
const mockLocation = { latitude: 0, longitude: 0 };

jest.mock('../../src/hooks/useLocation', () => ({
    useLocation: () => ({
        location: mockLocation,
        loading: false,
    }),
}));

jest.mock('../../src/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Tester' },
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

jest.mock('../../src/hooks/usePersonalizedSpots', () => ({
    usePersonalizedSpots: () => ({
        data: { spots: [] },
        isLoading: false,
    }),
}));

jest.mock('../../src/hooks/useServiceArea', () => ({
    useServiceArea: () => ({
        inServiceArea: true,
        showBanner: false,
        dismissBanner: jest.fn(),
        locationLoading: false,
    }),
}));

jest.mock('../../src/components/ToastProvider', () => ({
    useToast: () => ({ show: jest.fn(), hide: jest.fn() }),
}));

const mockSearchSpots = jest.fn();
const mockGetAllSpots = jest.fn();

jest.mock('../../src/services/spots.service', () => ({
    getAllSpots: () => mockGetAllSpots(),
    searchSpots: (params) => mockSearchSpots(params),
    getNearbySpots: jest.fn(() => []),
    getEditorsPicks: jest.fn(() => []),
    getEditorsPickChallenge: jest.fn(() => null),
    getWeeklyChampionSpot: jest.fn(() => null),
}));

jest.mock('../../src/services/weeklyRank.service', () => ({
    getWeeklySpotRanks: jest.fn(() => ({ spots: [] })),
}));

// Mock UI components
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }) => <>{children}</>,
}));

jest.mock('@react-navigation/native', () => ({
    useFocusEffect: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }) => <>{children}</>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAllSpots.mockResolvedValue({ data: [] });
        mockSearchSpots.mockResolvedValue([]);
    });

    it('should render categories', async () => {
        const { getByText } = render(<HomeScreen navigation={{ navigate: jest.fn() }} />);
        await waitFor(() => expect(getByText('By mood')).toBeTruthy());
    });

    it('should trigger search when category is selected', async () => {
        const navigate = jest.fn();
        const { getByText } = render(<HomeScreen navigation={{ navigate }} />);

        await waitFor(() => expect(getByText('Art')).toBeTruthy());

        fireEvent.press(getByText('Art'));

        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith('Explore', { category: 'art' });
        });
    });
});
