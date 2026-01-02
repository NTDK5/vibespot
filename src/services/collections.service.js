// src/services/collections.service.js

import api from "../config/axios";

// Get all collections
export const getAllCollections = async (options = {}) => {
  try {
    const { userId, isPublic, sortBy = "popular", limit = 20, offset = 0 } = options;
    const params = {};
    if (userId) params.userId = userId;
    if (isPublic !== undefined) params.isPublic = isPublic;
    if (sortBy) params.sortBy = sortBy;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    const response = await api.get("/collections", { params });
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to fetch collections" };
  }
};

// Get collection by ID
export const getCollectionById = async (id) => {
  try {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to fetch collection" };
  }
};

// Create collection
export const createCollection = async (data) => {
  try {
    const response = await api.post("/collections", data);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to create collection" };
  }
};

// Update collection
export const updateCollection = async (id, data) => {
  try {
    const response = await api.put(`/collections/${id}`, data);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to update collection" };
  }
};

// Delete collection
export const deleteCollection = async (id) => {
  try {
    const response = await api.delete(`/collections/${id}`);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to delete collection" };
  }
};

// Like/Unlike collection
export const likeCollection = async (id) => {
  try {
    const response = await api.post(`/collections/${id}/like`);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to like collection" };
  }
};

// Get user's collections
export const getUserCollections = async (userId) => {
  try {
    const response = await api.get(`/collections/user/${userId || ""}`);
    return response.data;
  } catch (err) {
    return { error: err.response?.data?.message || "Failed to fetch user collections" };
  }
};

