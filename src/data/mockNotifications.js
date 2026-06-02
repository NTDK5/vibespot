/**
 * MOCK_NOTIFICATIONS — design 21 sample copy for local dev.
 *
 * Used only when GET /user/me/notifications returns an empty list and
 * __DEV__ is true (see NotificationsScreen).
 */

export const MOCK_NOTIFICATIONS = [
  {
    id: 'mock-champion',
    type: 'champion',
    unread: true,
    body: '*Carmine Café* is this week\'s Champion — and you saved it three weeks before it ranked. **Early explorer badge unlocked.**',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    vibe: 'cafe',
  },
  {
    id: 'mock-reply',
    type: 'review',
    unread: true,
    body: '**Inês** from Carmine Café replied to your review: "Stop by Tuesday — Tomás is making sourdough."',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'mock-pick',
    type: 'pick',
    unread: false,
    body: 'The editors just added *The Quiet Floor* to this week\'s Editor\'s Picks.',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    vibe: 'studio',
  },
  {
    id: 'mock-watchlist',
    type: 'default',
    unread: false,
    body: '**3 new spots** were added to your watchlist *Lisbon mornings, slow*.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock-helpful',
    type: 'review',
    unread: false,
    body: '**14 explorers** found your review of *Carmine Café* helpful.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'mock-nearby',
    type: 'default',
    unread: false,
    body: 'A new rooftop opened in Alfama. **0.7 mi from you.** Care to be one of the first?',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    vibe: 'roof',
  },
  {
    id: 'mock-badge',
    type: 'pick',
    unread: false,
    body: 'You\'re 3 spots away from the **50 visited** badge.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];
