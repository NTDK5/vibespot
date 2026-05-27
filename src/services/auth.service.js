import api from "../config/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const loginUser = async (data) => {
  try {
    const response = await api.post("/auth/login", data);
    if (response.data.accessToken) {
      await AsyncStorage.setItem("token", response.data.accessToken);
    }
    return response.data;
  } catch (err) {
    throw err.response?.data || { message: "Login failed" };
  }
};

export const googleLoginUser = async (idToken) => {
  try {
    const response = await api.post("/auth/google", { idToken });
    if (response.data.accessToken) {
      await AsyncStorage.setItem("token", response.data.accessToken);
    }
    return response.data;
  } catch (err) {
    throw err.response?.data || { message: "Google login failed" };
  }
};

export const registerUser = async (data) => {
  try {
    const response = await api.post("/auth/register", data);
    if (response.data.accessToken) {
      await AsyncStorage.setItem("token", response.data.accessToken);
    }
    return response.data;
  } catch (err) {
    throw err.response?.data || { message: "Registration failed" };
  }
};

export const signOutUser = async () => {
  try {
    // Call backend logout endpoint to invalidate refresh token
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Continue even if backend call fails
      console.log("Backend logout call failed:", err);
    }

    // Clear local storage
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("user");

    return { success: true };
  } catch (err) {
    return { error: "Failed to sign out" };
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put("/user/me/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (err) {
    throw err.response?.data || { message: "Failed to change password" };
  }
};

/**
 * Request a password-reset email be sent to the given address.
 *
 * @status untested — backend endpoint may not be implemented yet.
 *   On 404 the UI surfaces a friendly "isn't wired up yet" toast via
 *   the authErrors normalizer; the raw Axios error is re-thrown so
 *   callers (AuthContext.requestReset) can inspect status.
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (err) {
    // Re-throw the raw axios error so the normalizer can see
    // `err.response.status`. The interceptor in src/config/axios.js
    // attached an `err.normalized` payload already.
    throw err;
  }
};

/**
 * Verify the 6-digit code emailed to the user after registration.
 *
 * @status untested — backend endpoint may not be implemented yet.
 */
export const verifyEmailCode = async (email, code) => {
  try {
    const response = await api.post("/auth/verify-email", { email, code });
    return response.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Re-send the email verification code.
 *
 * @status untested — backend endpoint may not be implemented yet.
 */
export const resendVerificationCode = async (email) => {
  try {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  } catch (err) {
    throw err;
  }
};
