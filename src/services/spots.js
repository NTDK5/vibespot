import api from "../config/axios";

// ----------------------------
// Create Spot (text only)
// ----------------------------
export const addSpot = async (data) => {
  try {
    const response = await api.post("/spot", data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to create spot" };
  }
};

// ----------------------------
// Upload Spot Images
// ----------------------------
export const uploadSpotImages = async (spotId, images = []) => {
  try {
    const formData = new FormData();

    images.forEach((img) => {
      formData.append("images", {
        uri: img.uri,
        name: img.fileName || `image-${Date.now()}.jpg`,
        type: img.mimeType || "image/jpeg",
      });
    });

    const response = await api.put(`/spot/${spotId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to upload images" };
  }
};

// ----------------------------
// Get All Spots
// ----------------------------
export const getAllSpots = async () => {
  try {
    const response = await api.get("/spot");
    return response.data;
  } catch (err) {
    return { error: "Failed to fetch spots" };
  }
};

// ----------------------------
// Get One Spot
// ----------------------------
export const getSpotById = async (id) => {
  try {
    const response = await api.get(`/spot/${id}`);
    return response.data;
  } catch (err) {
    return { error: "Spot not found" };
  }
};

// ----------------------------
// Update Spot (without images)
// ----------------------------
export const updateSpot = async (id, data) => {
  try {
    const response = await api.put(`/spot/${id}`, data);
    return response.data;
  } catch (err) {
    return { error: "Failed to update spot" };
  }
};

// ----------------------------
// Delete Spot
// ----------------------------
export const deleteSpot = async (id) => {
  try {
    const response = await api.delete(`/spot/${id}`);
    return response.data;
  } catch (err) {
    return { error: "Failed to delete spot" };
  }
};

// ----------------------------
// Rate Spot
// ----------------------------
export const rateSpot = async (id, rating) => {
  try {
    const response = await api.post(`/spot/${id}/rate`, { rating });
    return response.data;
  } catch (err) {
    return { error: "Failed to rate spot" };
  }
};
