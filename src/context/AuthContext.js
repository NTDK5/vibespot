import { createContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../services/auth.service";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser({ email, password });

      await AsyncStorage.setItem("token", data.accessToken);
      setUser(data.user);
      console.log("login sucess: ", data)
      return { user: data.user, error: null };
    } catch (err) {
      return {
        user: null,
        error: err.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{ user, login, loading, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
