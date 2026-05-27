import api from '../config/axios';

export const MOCK_NOTIFICATIONS = [
  {
    id: 'mock-1',
    type: 'champion',
    unread: true,
    title: 'Weekly champion',
    body: '**Alfama Rooftop** is this week\'s champion in your saved district.',
    spotTitle: 'Alfama Rooftop',
    spotId: null,
    createdAt: new Date().toISOString(),
    vibe: 'roof',
  },
  {
    id: 'mock-2',
    type: 'review',
    unread: true,
    title: 'New review',
    body: '**Mara** left a note on *Miradouro da Graça*.',
    spotTitle: 'Miradouro da Graça',
    spotId: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    vibe: 'park',
  },
  {
    id: 'mock-3',
    type: 'pick',
    unread: false,
    title: "Editor's pick",
    body: 'Editors stamped *Café a Brasileira* for the weekend list.',
    spotTitle: 'Café a Brasileira',
    spotId: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    vibe: 'cafe',
  },
];

export const getNotifications = async () => {
  try {
    const response = await api.get('/user/me/notifications');
    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to fetch notifications',
      status: err.response?.status,
    };
  }
};

export const markAllRead = async () => {
  try {
    const response = await api.post('/user/me/notifications/read-all');
    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to mark notifications read',
      status: err.response?.status,
    };
  }
};
