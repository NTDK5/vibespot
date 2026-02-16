// config/axios.js
import axios from "axios";
import { BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../utils/logger";
import { showToast } from "../utils/toastBus";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalizeApiError = (error) => {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;

  return {
    status,
    code: data?.code || (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      data?.message ||
      error?.message ||
      (status ? "Request failed" : "Network error. Please try again."),
    request_id: data?.request_id || null,
  };
};

// Request interceptor - add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // propagate request id if present (optional)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Silent retry for network errors (no response)
    if (!error.response && !originalRequest?._networkRetry) {
      originalRequest._networkRetry = true;
      await sleep(500);
      return api(originalRequest);
    }

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await AsyncStorage.setItem("token", accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
        // The auth context will handle the redirect
        return Promise.reject(refreshError);
      }
    }

    const normalized = normalizeApiError(error);

    // Log structured frontend error (no stack trace)
    logger.error({
      service: "api",
      action: "request_error",
      message: normalized.message,
      metadata: {
        code: normalized.code,
        status: normalized.status,
        request_id: normalized.request_id,
        method: originalRequest?.method,
        url: originalRequest?.url,
      },
    });

    // Toast user-triggered errors (4xx excluding 401 which is handled above)
    if (normalized.status && normalized.status >= 400 && normalized.status < 500 && normalized.status !== 401) {
      showToast(normalized.message, { variant: "error" });
    }

    error.normalized = normalized;
    return Promise.reject(error);
  }
);

export default api;
