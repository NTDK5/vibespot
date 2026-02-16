import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';

// Mocks
jest.mock('../../src/hooks/useLocation', () => ({
    useLocation: () => ({
        location: { latitude: 0, longitude: 0 },
        loading: false,
    }),
}));

jest.mock('../../src/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Tester' },
    }),
}));

jest.mock('../../src/context/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            primary: '#000',
            background: '#fff',
            surface: '#fff',
            text: '#000',
        },
    }),
}));

jest.mock('../../src/hooks/usePersonalizedSpots', () => ({
    usePersonalizedSpots: () => ({
        data: { spots: [] },
        isLoading: false,
    }),
}));

const mockSearchSpots = jest.fn();
const mockGetAllSpots = jest.fn();

jest.mock('../../src/services/spots.service', () => ({
    getAllSpots: () => mockGetAllSpots(),
    searchSpots: (params) => mockSearchSpots(params),
    getNearbySpots: jest.fn(() => []),
    getEditorsPicks: jest.fn(() => []),
    getWeeklyChampionSpot: jest.fn(() => null),
}));

jest.mock('../../src/services/weeklyRank.service', () => ({
    getWeeklySpotRanks: jest.fn(() => ({ spots: [] })),
}));

// Mock UI components
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }) => <>{children}</>,
}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }) => <>{children}</>,
}));

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAllSpots.mockResolvedValue([]);
        mockSearchSpots.mockResolvedValue([]);
    });

    it('should render categories', async () => {
        const { getByText } = render(<HomeScreen navigation={{ navigate: jest.fn() }} />);
        await waitFor(() => expect(getByText('Explore')).toBeTruthy());
    });

    it('should trigger search when category is selected', async () => {
        const { getByText } = render(<HomeScreen navigation={{ navigate: jest.fn() }} />);

        // Find a category and press it (e.g. "Art")
        // Assuming "Art" is in the list
        const categoryButton = getByText('Art');
        fireEvent.press(categoryButton);

        // This should trigger state update and eventually call searchSpots or open modal
        // In current implementation, it opens modal and sets searchCategory
        // which effectively triggers search inside the modal or via effects

        // Wait for the effect
        await waitFor(() => {
            // Since the modal opens and uses the same search logic (if implemented that way)
            // OR if we directly call searchSpots in effect
        });

        // Actually, in the code, `setSearchCategory` triggers `handleSearch` via `useEffect`.
        // So we expect `searchSpots` to be called with `{ category: 'art' }` (or whatever ID for Art)
        // or `{ q: '', category: 'art' }`

        // Wait for searchSpots to be called
        /*
          The modified HomeScreen.js has a useEffect:
          useEffect(() => {
            if (searchQuery.length > 2 || searchCategory) {
              handleSearch(searchQuery, searchCategory);
            } ...
          }, [searchQuery, searchCategory]);
        */

        // We need to know the ID for "Art". From constants.js: { id: 'art', label: 'Art' }

        await waitFor(() => {
            expect(mockSearchSpots).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'art'
                })
            );
        });
    });
});
