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
