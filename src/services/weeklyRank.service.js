import api from "../config/axios";

// ----------------------------
// Get Weekly Spot Ranks
// ----------------------------
export const getWeeklySpotRanks = async (weekNumber = null) => {
  try {
    const params = weekNumber ? { weekNumber } : {};
    const response = await api.get("/spot/weeklyspotrank", { params });
    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || "Failed to fetch weekly ranks",
    };
  }
};

