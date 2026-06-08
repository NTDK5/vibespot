import api from "../config/axios";

export async function applySpotOwner(payload) {
  try {
    const { data } = await api.post("/spot-owner/apply", payload);
    return { data, error: null };
  } catch (err) {
    return {
      error: err.response?.data?.message || "Could not submit application",
    };
  }
}

export async function getMySpotOwnerApplication() {
  try {
    const { data } = await api.get("/spot-owner/application/me");
    return { data, error: null };
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to load application" };
  }
}

export async function listMyOwnerSpots() {
  try {
    const { data } = await api.get("/owner/spots");
    return { data, error: null };
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to load your spots" };
  }
}

export async function createOwnerSpot(spotData) {
  try {
    const { data } = await api.post("/owner/spots", spotData, {
      headers: { "Content-Type": "application/json" },
    });
    return data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to create spot" };
  }
}

export async function updateOwnerSpot(id, spotData) {
  try {
    const { data } = await api.put(`/owner/spots/${id}`, spotData);
    return data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to update spot" };
  }
}

export async function uploadOwnerSpotImages(spotId, images = []) {
  try {
    const formData = new FormData();
    images.forEach((img) => {
      formData.append("images", {
        uri: img.uri,
        name: img.fileName || `image-${Date.now()}.jpg`,
        type: img.mimeType || "image/jpeg",
      });
    });
    const { data } = await api.put(`/owner/spots/${spotId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to upload images" };
  }
}

export async function deleteOwnerSpot(id) {
  try {
    const { data } = await api.delete(`/owner/spots/${id}`);
    return data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to delete spot" };
  }
}

export async function getOwnerSpotAnalytics(spotId) {
  try {
    const { data } = await api.get(`/owner/spots/${spotId}/analytics`);
    return { data, error: null };
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to load analytics" };
  }
}

export async function getOwnerSummary() {
  try {
    const { data } = await api.get("/owner/spots/summary");
    return { data, error: null };
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to load summary" };
  }
}
