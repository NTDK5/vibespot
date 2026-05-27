import api from "../config/axios";
import { isLocalImageUri } from "../utils/reviewPhotos";

function formatReviewError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details)
    ? data.details.join(" ")
    : null;
  return (
    details ||
    data?.message ||
    err?.normalized?.message ||
    "Failed to create review"
  );
}

function toUploadFile(photo, index) {
  if (typeof photo === "string") {
    return {
      uri: photo,
      name: `review-${index}.jpg`,
      type: "image/jpeg",
    };
  }
  return {
    uri: photo.uri,
    name: photo.name || photo.fileName || `review-${index}.jpg`,
    type: photo.type || photo.mimeType || "image/jpeg",
  };
}

// ----------------------------
// Get Spot Comments
// ----------------------------
export const getSpotComments = async (spotId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/spot/${spotId}/comments`, {
      params: { page, limit },
    });
    const payload = response.data;

    if (Array.isArray(payload)) {
      return { comments: payload, meta: null };
    }

    if (Array.isArray(payload?.comments)) {
      return {
        comments: payload.comments,
        meta: payload?.meta ?? null,
      };
    }

    return { comments: [], meta: null };
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
// Create Comment (Rich payload)
//
// Phase 4 extension: lets WriteReviewScreen ship an editorial review
// with a rating, photo URIs, vibe tags, and an anonymous flag.
// Backend may ignore any extra field — that is acceptable for now.
// ----------------------------
export const createCommentWithMeta = async (spotId, payload = {}) => {
  const { photos: rawPhotos = [], ...rest } = payload;
  const photoList = Array.isArray(rawPhotos) ? rawPhotos : [];
  const localPhotos = photoList.filter((p) => {
    const uri = typeof p === "string" ? p : p?.uri;
    return uri && isLocalImageUri(uri);
  });
  const remotePhotos = photoList
    .map((p) => (typeof p === "string" ? p : p?.uri))
    .filter((uri) => uri && !isLocalImageUri(uri));

  try {
    if (localPhotos.length > 0) {
      const formData = new FormData();
      formData.append("text", rest.text);
      formData.append("rating", String(rest.rating));
      formData.append("anonymous", rest.anonymous ? "true" : "false");
      if (Array.isArray(rest.tags) && rest.tags.length > 0) {
        formData.append("tags", JSON.stringify(rest.tags));
      }

      localPhotos.forEach((photo, index) => {
        const file = toUploadFile(photo, index);
        formData.append("images", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      });

      const response = await api.post(`/spot/${spotId}/comments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const response = await api.post(`/spot/${spotId}/comments`, {
      ...rest,
      photos: remotePhotos,
    });
    return response.data;
  } catch (err) {
    return {
      error: formatReviewError(err),
      status: err.response?.status,
    };
  }
};

export const uploadReviewPhotos = async (spotId, commentId, images = []) => {
  try {
    const formData = new FormData();
    images.forEach((photo, index) => {
      formData.append("images", toUploadFile(photo, index));
    });

    const response = await api.post(
      `/spot/${spotId}/comments/${commentId}/photos`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  } catch (err) {
    return {
      error: formatReviewError(err),
      status: err.response?.status,
    };
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

