import api from "../config/axios";

// ----------------------------
// Get Spot Comments
// ----------------------------
export const getSpotComments = async (spotId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/spot/${spotId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to fetch comments" };
  }
};

// ----------------------------
// Create Comment
// ----------------------------
export const createComment = async (spotId, text, userId) => {
  try {
    const response = await api.post(`/spot/${spotId}/comments`, {
      text,
      userId,
    });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to create comment" };
  }
};

// ----------------------------
// Delete Comment
// ----------------------------
export const deleteComment = async (spotId, commentId) => {
  try {
    const response = await api.delete(`/spot/${spotId}/comments/${commentId}`);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to delete comment" };
  }
};

