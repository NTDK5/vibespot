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
    await AsyncStorage.removeItem("token");
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
