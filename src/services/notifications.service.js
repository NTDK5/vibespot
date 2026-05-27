import api from '../config/axios';
import { MOCK_NOTIFICATIONS } from '../data/mockNotifications';

export { MOCK_NOTIFICATIONS };

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

export const markNotificationsRead = async () => {
  try {
    // Preferred endpoint (may not exist yet on all backends).
    const response = await api.post('/user/me/notifications/read');
    return response.data;
  } catch (err) {
    // Backward-compatible fallback.
    try {
      const response = await api.post('/user/me/notifications/read-all');
      return response.data;
    } catch (err2) {
      return {
        error:
          err2.response?.data?.message ||
          err.response?.data?.message ||
          'Failed to mark notifications read',
        status: err2.response?.status || err.response?.status,
      };
    }
  }
};

// Backward-compatible alias.
export const markAllRead = markNotificationsRead;
