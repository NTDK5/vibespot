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

// ----------------------------
// Get Nearby Spots
// ----------------------------
export const getNearbySpots = async (lat, lng, radius = 5000) => {
  try {
    if (!lat || !lng) {
      return { error: "Latitude and longitude are required" };
    }

    const response = await api.get(`/spot/nearby`, {
      params: { lat, lng, radius }, // Axios handles query parameters cleanly
    });

    // Backend returns distance in meters → enrich here
    const enriched = response.data.map((spot) => ({
      ...spot,
      distanceKm: spot.distance / 1000,
      approxTimeMin: spot.distance / 80, // ~80m/min walking speed
    }));

    return enriched;
  } catch (err) {
    return {
      error: err.response?.data?.message || "Failed to fetch nearby spots",
    };
  }
};
// ----------------------------
// Search Spots
// ----------------------------
export const searchSpots = async ({
  q,
  category,
  minRating,
  priceRange,
  page = 1,
  limit = 20,
}) => {
  try {
    const response = await api.get("/spot/search", {
      params: {
        q,
        category,
        minRating,
        priceRange,
        page,
        limit,
      },
    });

    return response.data;
  } catch (err) {
    return {
      error: err.response?.data?.message || "Failed to search spots",
    };
  }
};

