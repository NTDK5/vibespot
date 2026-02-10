import api from "../config/axios";

// Get personalized spot recommendations for the current user
export const getPersonalizedSpots = async ({ lat, lng } = {}) => {
  try {
    const response = await api.get("/recommendations", {
      params: {
        lat,
        lng,
      },
    });
    return response.data;
  } catch (err) {
    return {
      error:
        err.response?.data?.message ||
        "Failed to fetch personalized recommendations",
    };
  }
};

// Get user progression (level, XP, badges)
export const getUserProgression = async () => {
  try {
    const response = await api.get("/user/me/progression");
    return response.data;
  } catch (err) {
    return {
      error:
        err.response?.data?.message ||
        "Failed to fetch user progression",
    };
  }
};

