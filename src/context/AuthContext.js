import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../services/auth.service";
import api from "../config/axios";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true to check auth state

  // Check for existing session on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      
      if (token && storedUser) {
        // Restore user from storage
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Verify token is still valid by fetching current user
        try {
          const response = await api.get("/user/me");
          if (response.data) {
            const updatedUser = response.data;
            setUser(updatedUser);
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          // Token invalid, clear storage
          console.log("Token validation failed, clearing auth:", error);
          await clearAuth();
        }
      } else {
        // No stored auth, ensure clean state
        await clearAuth();
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      await clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = async () => {
    await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
    setUser(null);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser({ email, password });

      if (data.accessToken && data.user) {
        // Store token and user
        await AsyncStorage.setItem("token", data.accessToken);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        
        if (data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.refreshToken);
        }
        
        setUser(data.user);
        console.log("Login success: ", data);
        return { user: data.user, error: null };
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      await clearAuth();
      return {
        user: null,
        error: err.response?.data?.message || err.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call backend logout endpoint
      try {
        await api.post("/auth/logout");
      } catch (err) {
        // Continue even if backend call fails
        console.log("Backend logout call failed:", err);
      }
      
      // Clear local storage
      await clearAuth();
      
      return { success: true, error: null };
    } catch (error) {
      // Even if logout fails, clear local auth
      await clearAuth();
      return {
        success: false,
        error: error.message || "Failed to sign out",
      };
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
