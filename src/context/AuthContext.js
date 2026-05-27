import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  googleLoginUser,
  registerUser,
  requestPasswordReset,
  verifyEmailCode,
  resendVerificationCode,
} from "../services/auth.service";
import api from "../config/axios";
import { normalizeAuthError } from "../utils/authErrors";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true to check auth state

  // When the backend says emailVerified=false after register/login, we
  // stash the email here so VerifyEmailScreen can pick it up without
  // passing it through navigation params.
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

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
        // If the backend ever returns emailVerified=false on login,
        // keep the user logged in but flag the email so the navigator
        // can route through VerifyEmail.
        if (data.user.emailVerified === false) {
          setPendingVerificationEmail(email);
        }
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

  const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const data = await googleLoginUser(idToken);

      if (data.accessToken && data.user) {
        // Store token and user
        await AsyncStorage.setItem("token", data.accessToken);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        if (data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.refreshToken);
        }

        setUser(data.user);
        return { user: data.user, error: null };
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      // Don't clear auth here automatically, as it might just be a failed attempt
      // but if we were logged in before, we probably aren't now if we're trying to log in
      return {
        user: null,
        error: err.message || "Google login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Email + password registration. Mirrors the persistence path of
   * `login` so the user is auto-signed-in on success. If the backend
   * returns `user.emailVerified === false` we stash the email in
   * `pendingVerificationEmail` so VerifyEmailScreen can pick it up.
   */
  const register = async ({ name, email, password, homeCity }) => {
    setLoading(true);
    try {
      const data = await registerUser({ name, email, password, homeCity });

      if (data.accessToken && data.user) {
        await AsyncStorage.setItem("token", data.accessToken);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        if (data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.refreshToken);
        }
        setUser(data.user);

        if (data.user.emailVerified === false) {
          setPendingVerificationEmail(email);
        }
        return { user: data.user, error: null };
      }
      throw new Error("Invalid register response");
    } catch (err) {
      return {
        user: null,
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ask the backend to email a password-reset link. Returns
   * `{ ok, error }` so screens can surface failures via Toast without
   * crashing — the helpers may target endpoints that don't exist yet.
   */
  const requestReset = async (email) => {
    try {
      await requestPasswordReset(email);
      return { ok: true, error: null };
    } catch (err) {
      return {
        ok: false,
        error: normalizeAuthError(err, "Could not send reset link"),
      };
    }
  };

  const verifyEmail = async (code) => {
    if (!pendingVerificationEmail) {
      return { ok: false, error: "No pending email" };
    }
    try {
      const data = await verifyEmailCode(pendingVerificationEmail, code);
      setPendingVerificationEmail(null);
      if (data?.user) {
        setUser(data.user);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      } else if (user) {
        // Best-effort local flag flip if the backend doesn't echo the
        // full user object back.
        const next = { ...user, emailVerified: true };
        setUser(next);
        await AsyncStorage.setItem("user", JSON.stringify(next));
      }
      return { ok: true, error: null };
    } catch (err) {
      return {
        ok: false,
        error: normalizeAuthError(err, "Verification failed"),
      };
    }
  };

  const resendVerification = async () => {
    if (!pendingVerificationEmail) {
      return { ok: false, error: "No pending email" };
    }
    try {
      await resendVerificationCode(pendingVerificationEmail);
      return { ok: true, error: null };
    } catch (err) {
      return {
        ok: false,
        error: normalizeAuthError(err, "Could not resend"),
      };
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
      setPendingVerificationEmail(null);

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

  const updateLocalUser = async (patch) => {
    if (!user) return;
    const next = { ...user, ...patch };
    setUser(next);
    await AsyncStorage.setItem("user", JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        // existing keys — DO NOT rename, screens depend on them
        user,
        login,
        logout,
        loginWithGoogle,
        loading,
        isSuperAdmin,
        updateLocalUser,
        // new in Phase 2
        register,
        requestReset,
        verifyEmail,
        resendVerification,
        pendingVerificationEmail,
        setPendingVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
