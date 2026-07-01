import { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  googleLoginUser,
  registerUser,
  requestPasswordReset,
  resetPassword as resetPasswordRequest,
  verifyEmailCode,
  resendVerificationCode,
} from "../services/auth.service";
import api from "../config/axios";
import { normalizeAuthError } from "../utils/authErrors";
import { authEvents } from "../utils/authEvents";
import { track, Events } from "../analytics";
import { readLaunchStorage } from "../bootstrap/launchStorage";

export const AuthContext = createContext();

function normalizeAuthPayload(raw) {
  const data =
    raw?.data && typeof raw.data === "object" && !raw.accessToken && !raw.token
      ? raw.data
      : raw;
  if (!data || typeof data !== "object") return {};

  const accessToken =
    data.accessToken ?? data.token ?? data.access_token ?? null;
  const refreshToken =
    data.refreshToken ?? data.refresh_token ?? null;
  let user = data.user ?? null;

  if (!user && data.id && (data.email || data.name || data.role)) {
    const {
      accessToken: _a,
      token: _t,
      refreshToken: _r,
      refresh_token: _r2,
      ...rest
    } = data;
    if (rest.id) user = rest;
  }

  return { accessToken, refreshToken, user };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);
  const [didLoginThisSession, setDidLoginThisSession] = useState(false);

  const clearAuth = useCallback(async () => {
    await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
    setUser(null);
    setDidLoginThisSession(false);
  }, []);

  const persistAuthSession = useCallback(
    async ({ accessToken, refreshToken, user: nextUser }) => {
      if (accessToken) await AsyncStorage.setItem("token", accessToken);
      if (refreshToken) await AsyncStorage.setItem("refreshToken", refreshToken);
      if (nextUser) {
        await AsyncStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);
      }
    },
    []
  );

  const completeLoginFromResponse = useCallback(
    async (raw) => {
      const { accessToken, refreshToken, user: payloadUser } =
        normalizeAuthPayload(raw);
      if (!accessToken) {
        throw new Error("Invalid login response");
      }

      if (accessToken) await AsyncStorage.setItem("token", accessToken);
      if (refreshToken) await AsyncStorage.setItem("refreshToken", refreshToken);

      let resolvedUser = payloadUser;
      try {
        const response = await api.get("/user/me");
        if (response.data) resolvedUser = response.data;
      } catch (err) {
        if (!resolvedUser) throw err;
      }

      await persistAuthSession({
        accessToken,
        refreshToken,
        user: resolvedUser,
      });
      return resolvedUser;
    },
    [persistAuthSession]
  );

  const refreshUserFromMe = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const response = await api.get("/user/me");
    if (response.data) {
      setUser(response.data);
      await AsyncStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    }
    return null;
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      const { token, userRaw } = await readLaunchStorage();

      if (!token) {
        await clearAuth();
        setLoading(false);
        return;
      }

      let storedUser = null;
      const hasUser = !!userRaw;

      if (userRaw) {
        try {
          storedUser = JSON.parse(userRaw);
          setUser(storedUser);
        } catch {
          /* corrupt cache — ignore */
        }
      }

      // Unblock UI after local storage read — do not wait on /user/me.
      setLoading(false);

      api
        .get("/user/me")
        .then(async (response) => {
          if (response.data) {
            setUser(response.data);
            await AsyncStorage.setItem("user", JSON.stringify(response.data));
          }
          if (__DEV__) {
            console.log("[auth restore]", { hasToken: true, hasUser, meStatus: "ok" });
          }
        })
        .catch(async (error) => {
          const status = error.response?.status;
          if (status === 401 || status === 404) {
            if (__DEV__) {
              console.log("[auth restore]", { hasToken: true, hasUser, meStatus: String(status) });
            }
            await clearAuth();
          } else if (storedUser) {
            setUser(storedUser);
            if (__DEV__) {
              console.log("[auth restore]", {
                hasToken: true,
                hasUser,
                meStatus: status ? String(status) : "network",
              });
              console.log("auth: offline restore");
            }
          } else if (__DEV__) {
            console.log("[auth restore]", {
              hasToken: true,
              hasUser,
              meStatus: status ? String(status) : "network",
            });
          }
        });
    } catch (error) {
      console.error("Error checking auth state:", error);
      await clearAuth();
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  useEffect(() => {
    return authEvents.subscribe(() => {
      clearAuth();
    });
  }, [clearAuth]);

  const login = async (email, password) => {
    setLoading(true);
    setDidLoginThisSession(true);
    try {
      const data = await loginUser({ email, password });
      const resolvedUser = await completeLoginFromResponse(data);

      if (resolvedUser?.emailVerified === false) {
        setPendingVerificationEmail(email);
      }
      track(Events.SIGN_IN_COMPLETED, { method: "email" });
      return { user: resolvedUser, error: null };
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
    setDidLoginThisSession(true);
    try {
      const data = await googleLoginUser(idToken);
      const resolvedUser = await completeLoginFromResponse(data);
      track(Events.SIGN_IN_COMPLETED, { method: "google" });
      return { user: resolvedUser, error: null };
    } catch (err) {
      setDidLoginThisSession(false);
      return {
        user: null,
        error: err.message || "Google login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, homeCity }) => {
    setLoading(true);
    setDidLoginThisSession(true);
    try {
      const data = await registerUser({ name, email, password, homeCity });
      const resolvedUser = await completeLoginFromResponse(data);

      if (resolvedUser?.emailVerified === false) {
        setPendingVerificationEmail(email);
      }
      track(Events.SIGN_UP_COMPLETED, { method: "email" });
      return { user: resolvedUser, error: null };
    } catch (err) {
      setDidLoginThisSession(false);
      const data = err?.response?.data;
      const details = Array.isArray(data?.details) ? data.details.join(" ") : null;
      return {
        user: null,
        error:
          details ||
          data?.message ||
          err?.normalized?.message ||
          err?.message ||
          "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

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

  const resetPassword = async (email, code, newPassword) => {
    try {
      await resetPasswordRequest(email, code, newPassword);
      return { ok: true, error: null };
    } catch (err) {
      return {
        ok: false,
        error: normalizeAuthError(err, "Could not reset password"),
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
      try {
        const refreshed = await refreshUserFromMe();
        if (refreshed) return { ok: true, error: null };
      } catch {
        /* fall through to local patch */
      }
      if (data?.user) {
        setUser(data.user);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      } else if (user) {
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
      try {
        await api.post("/auth/logout");
      } catch (err) {
        console.log("Backend logout call failed:", err);
      }
      await clearAuth();
      setPendingVerificationEmail(null);
      return { success: true, error: null };
    } catch (error) {
      await clearAuth();
      return {
        success: false,
        error: error.message || "Failed to sign out",
      };
    } finally {
      setLoading(false);
    }
  };

  const roleSlug =
    user?.roleSlug ?? (user?.role === "superadmin" ? "superadmin" : "user");
  const isSuperAdmin = roleSlug === "superadmin" || user?.role === "superadmin";
  const isSpotOwner =
    user?.isSpotOwner === true || roleSlug === "spot_owner";
  const spotOwnerApplication = user?.spotOwnerApplication ?? null;
  const isSpotOwnerPending = spotOwnerApplication?.status === "pending";
  const canManageOwnSpots = isSpotOwner;
  const canAddSpot = isSuperAdmin || isSpotOwner;

  const updateLocalUser = async (patch) => {
    if (!user) return;
    const next = { ...user, ...patch };
    setUser(next);
    await AsyncStorage.setItem("user", JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loginWithGoogle,
        loading,
        didLoginThisSession,
        isSuperAdmin,
        isSpotOwner,
        spotOwnerApplication,
        isSpotOwnerPending,
        canManageOwnSpots,
        canAddSpot,
        refreshUserFromMe,
        updateLocalUser,
        register,
        requestReset,
        resetPassword,
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
