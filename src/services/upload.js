import * as ImagePicker from "expo-image-picker";
import api from "../config/axios";

export const pickImage = async () => {
  // Ask permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Permission to access photos is required!");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  };
};

export const pickMultipleImages = async (maxImages = 10) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Permission to access photos is required!");
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxImages,
    quality: 0.8,
  });

  if (result.canceled) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  }));
};

export const uploadSpotImages = async (spotId, images) => {
  const form = new FormData();

  images.forEach(img => {
    form.append("images", {
      uri: img.uri,
      name: img.name,
      type: img.type,
    });
  });

  try {
    const res = await api.post(`/spot/${spotId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (err) {
    console.log(err)
    return { error: "Image upload failed" };
  }
};
