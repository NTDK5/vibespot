import api from "../config/axios";

// ----------------------------
// Get Visited Spots
// ----------------------------
export const getVisitedSpots = async () => {
  try {
    const response = await api.get("/user/me/visited-spots");
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to fetch visited spots" };
  }
};

// ----------------------------
// Mark Spot as Visited
// ----------------------------
export const markSpotAsVisited = async (spotId) => {
  try {
    const response = await api.post("/user/me/visited-spots", { spotId });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to mark spot as visited" };
  }
};

// ----------------------------
// Check if Spot is Visited
// ----------------------------
export const isSpotVisited = async (spotId) => {
  try {
    const response = await api.get(`/user/me/visited-spots/${spotId}`);
    return response.data.visited || false;
  } catch (err) {
    return false;
  }
};

