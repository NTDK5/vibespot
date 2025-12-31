import api from "../config/axios";

// ----------------------------
// Get Saved Spots
// ----------------------------
export const getSavedSpots = async () => {
  try {
    const response = await api.get("/user/me/saved-spots");
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to fetch saved spots" };
  }
};

// ----------------------------
// Save Spot
// ----------------------------
export const saveSpot = async (spotId) => {
  try {
    const response = await api.post("/user/me/saved-spots", { spotId });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to save spot" };
  }
};

// ----------------------------
// Unsave Spot
// ----------------------------
export const unsaveSpot = async (spotId) => {
  try {
    const response = await api.delete("/user/me/saved-spots", { data: { spotId } });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to unsave spot" };
  }
};

// ----------------------------
// Check if Spot is Saved
// ----------------------------
export const isSpotSaved = async (spotId) => {
  try {
    const savedSpots = await getSavedSpots();
    if (savedSpots.error) return false;
    return Array.isArray(savedSpots) && savedSpots.some(spot => spot.id === spotId);
  } catch (err) {
    return false;
  }
};

