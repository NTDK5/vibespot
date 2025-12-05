import { createContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../services/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const data = await loginUser({ email, password });
  
      console.log("LOGIN SUCCESS:", data);
  
      await AsyncStorage.setItem("token", data.accessToken);
      setUser(data.user);
  
      return { user: data.user, error: null };
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
  
      return {
        user: null,
        error: err.response?.data?.message || err.message || "Login failed",
      };
    }
  };
  

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
};
