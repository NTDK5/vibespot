import api from '../config/axios';

export async function registerPushToken(token, platform) {
  try {
    const response = await api.post('/user/me/push-tokens', { token, platform });
    return { data: response.data, error: null };
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to register push token',
      status: err.response?.status,
    };
  }
}

export async function unregisterPushToken(token) {
  try {
    const response = await api.delete('/user/me/push-tokens', {
      data: { token },
    });
    return { data: response.data, error: null };
  } catch (err) {
    return {
      error: err.response?.data?.message || 'Failed to unregister push token',
      status: err.response?.status,
    };
  }
}
