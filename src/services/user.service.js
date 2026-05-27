import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/axios';

export const profileStorageKey = (userId) => `fena.userProfile.${userId}`;

export const getMe = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to fetch profile',
      status: err.response?.status,
    };
  }
};

export const updateMe = async (payload) => {
  try {
    const response = await api.put('/user/me', payload);
    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to update profile',
      status: err.response?.status,
    };
  }
};

// Alias for the Phase 5 state rewrite naming.
export const updateProfile = updateMe;

export const getMyReviews = async () => {
  try {
    const response = await api.get('/user/me/reviews');
    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to fetch reviews',
      status: err.response?.status,
    };
  }
};

export const loadLocalProfile = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(profileStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalProfile = async (userId, patch) => {
  const key = profileStorageKey(userId);
  const existing = await loadLocalProfile(userId);
  const next = { ...(existing || {}), ...patch };
  await AsyncStorage.setItem(key, JSON.stringify(next));
  return next;
};
