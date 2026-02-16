import api from "../config/axios";

export const getBadgeProgress = async (userId) => {
  try {
    const response = await api.get(`/user/${userId}/badge-progress`);
    return response.data;
  } catch (err) {
    return {
      error:
        err?.normalized?.message ||
        err.response?.data?.message ||
        "Failed to fetch badge progress",
    };
  }
};

