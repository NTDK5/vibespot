import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/axios";

/* ---------------------------
   Global Vibes
---------------------------- */
export const getAllVibes = async () => {
  const { data } = await api.get("/vibes");
  return data;
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

