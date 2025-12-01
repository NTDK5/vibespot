import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { getUserRole } from "../services/auth";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const r = await getUserRole(currentUser.uid);
        setRole(r || "user");
      } else {
        setRole("user");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    role,
    isAdmin: role === "admin",
    loading,
    isAuthenticated: !!user,
  };
};
