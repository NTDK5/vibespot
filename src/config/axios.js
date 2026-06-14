// config/axios.js
import axios from "axios";
import { BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../utils/logger";
import { showToast } from "../utils/toastBus";
import { networkEvents } from "../utils/networkEvents";
import { authEvents } from "../utils/authEvents";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const APP_START_MS = Date.now();
const COLD_START_404_WINDOW_MS = 60_000;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const MAX_RETRIES = 3;

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

function tokensFromRefreshBody(body) {
  if (!body || typeof body !== "object") return {};
  const nested = body.data && typeof body.data === "object" ? body.data : body;
  return {
    accessToken:
      nested.accessToken ?? nested.token ?? nested.access_token ?? null,
    refreshToken:
      nested.refreshToken ?? nested.refresh_token ?? null,
  };
}

function isRetryableError(error) {
  const status = error?.response?.status;
  if (!error.response) return true;
  if ([502, 503, 504].includes(status)) return true;
  if (
    status === 404 &&
    Date.now() - APP_START_MS < COLD_START_404_WINDOW_MS
  ) {
    return true;
  }
  return false;
}

async function retryRequest(config) {
  const retryCount = config._retryCount ?? 0;
  if (retryCount >= MAX_RETRIES) return null;
  config._retryCount = retryCount + 1;
  await sleep(RETRY_DELAYS_MS[retryCount] ?? 4000);
  return api(config);
}

// Request interceptor - add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - retry cold-start failures, refresh token, normalize errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      isRetryableError(error)
    ) {
      const retried = await retryRequest(originalRequest);
      if (retried) return retried;
    }

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        authEvents.emitSessionExpired();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = tokensFromRefreshBody(
          response.data
        );
        if (!accessToken) {
          return Promise.reject(error);
        }

        await AsyncStorage.setItem("token", accessToken);
        if (newRefresh) {
          await AsyncStorage.setItem("refreshToken", newRefresh);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (refreshError.response?.status === 401) {
          authEvents.emitSessionExpired();
        }
        return Promise.reject(refreshError);
      }
    }

    // Offline / connection lost after retries.
    if (!error.response) {
      networkEvents.setOffline(true);
    }

    const normalized = normalizeApiError(error);

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
        retryCount: originalRequest?._retryCount ?? 0,
      },
    });

    if (normalized.status && normalized.status >= 400 && normalized.status < 500 && normalized.status !== 401) {
      showToast(normalized.message, { variant: "error" });
    }

    if (normalized.status && normalized.status >= 500) {
      showToast("Return to sender · try again", { variant: "error" });
    }

    error.normalized = normalized;
    return Promise.reject(error);
  }
);

export default api;
