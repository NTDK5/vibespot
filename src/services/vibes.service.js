import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/axios";
import { ETHIOPIAN_VIBES } from "../data/vibes";

/* ---------------------------
   Global Vibes
---------------------------- */
export const getAllVibes = async () => {
  try {
    const { data } = await api.get("/vibes");
    return data;
  } catch {
    // Fallback to local Ethiopian vibe seed data when offline
    return ETHIOPIAN_VIBES;
  }
};

/* ---------------------------
   Spot Vibes (Aggregated)
---------------------------- */
export const getSpotVibes = async (spotId) => {
  const { data } = await api.get(`/spot/${spotId}/vibes`);
  return data;
};

/* ---------------------------
   User Spot Vibes
---------------------------- */
export const getMySpotVibes = async (spotId) => {
  const { data } = await api.get(`/spot/${spotId}/vibes/me`);
  return data; // [vibeId]
};

/* ---------------------------
   Add / Update Spot Vibes
---------------------------- */
export const addSpotVibes = async (spotId, vibeIds) => {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("No token found, please login");
  }

  const { data } = await api.post(
    `/spot/${spotId}/vibes`,
    { vibeIds }, // ✅ BODY
    {
      headers: {
        Authorization: `Bearer ${token}`, // ✅ CONFIG
      },
    }
  );

  return data;
};

