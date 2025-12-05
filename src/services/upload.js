// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// import { storage } from '../firebase/config';
// import * as ImagePicker from 'expo-image-picker';

// /**
//  * Upload Service
//  * Handles file uploads to Firebase Storage
//  */

// /**
//  * Request media library permissions
//  */
// export const requestMediaLibraryPermissions = async () => {
//   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//   if (status !== 'granted') {
//     alert('Sorry, we need camera roll permissions to upload images!');
//     return false;
//   }
//   return true;
// };

// /**
//  * Pick an image from the device
//  */
// export const pickImage = async (options = {}) => {
//   const hasPermission = await requestMediaLibraryPermissions();
//   if (!hasPermission) return null;

//   const result = await ImagePicker.launchImageLibraryAsync({
//     mediaTypes: ImagePicker.MediaTypeOptions.Images,
//     allowsEditing: options.allowsEditing || true,
//     aspect: options.aspect || [4, 3],
//     quality: options.quality || 0.8,
//     allowsMultipleSelection: options.allowsMultipleSelection || false,
//   });

//   if (!result.canceled) {
//     return options.allowsMultipleSelection ? result.assets : result.assets[0];
//   }
//   return null;
// };

// /**
//  * Pick multiple images
//  */
// export const pickMultipleImages = async (maxImages = 10) => {
//   const hasPermission = await requestMediaLibraryPermissions();
//   if (!hasPermission) return [];

//   const result = await ImagePicker.launchImageLibraryAsync({
//     mediaTypes: ImagePicker.MediaTypeOptions.Images,
//     allowsEditing: false,
//     quality: 0.8,
//     allowsMultipleSelection: true,
//   });

//   if (!result.canceled) {
//     return result.assets.slice(0, maxImages);
//   }
//   return [];
// };

// /**
//  * Upload a single image to Firebase Storage
//  */
// export const uploadImage = async (uri, path, onProgress) => {
//   try {
//     // Convert URI to blob
//     const response = await fetch(uri);
//     const blob = await response.blob();

//     // Create storage reference
//     const storageRef = ref(storage, path);

//     // Upload file
//     const uploadTask = uploadBytes(storageRef, blob);

//     // Monitor upload progress (if callback provided)
//     if (onProgress) {
//       // Note: uploadBytes doesn't support progress tracking directly
//       // For progress tracking, use uploadBytesResumable instead
//       onProgress(50);
//     }

//     await uploadTask;
//     onProgress && onProgress(100);

//     // Get download URL
//     const downloadURL = await getDownloadURL(storageRef);
//     return { url: downloadURL, error: null };
//   } catch (error) {
//     console.error('Error uploading image:', error);
//     return { url: null, error: error.message };
//   }
// };

// /**
//  * Upload multiple images
//  */
// export const uploadMultipleImages = async (uris, basePath, onProgress) => {
//   const uploadPromises = uris.map((uri, index) => {
//     const fileName = `image_${Date.now()}_${index}.jpg`;
//     const path = `${basePath}/${fileName}`;
//     return uploadImage(uri, path);
//   });

//   try {
//     const results = await Promise.all(uploadPromises);
//     const urls = results
//       .filter(result => result.url)
//       .map(result => result.url);
    
//     return { urls, errors: results.filter(r => r.error).map(r => r.error) };
//   } catch (error) {
//     return { urls: [], errors: [error.message] };
//   }
// };

// /**
//  * Delete an image from Firebase Storage
//  */
// export const deleteImage = async (path) => {
//   try {
//     const storageRef = ref(storage, path);
//     await deleteObject(storageRef);
//     return { error: null };
//   } catch (error) {
//     console.error('Error deleting image:', error);
//     return { error: error.message };
//   }
// };

// /**
//  * Upload place images (main + gallery)
//  */
// export const uploadPlaceImages = async (mainImageUri, galleryImageUris = [], placeId) => {
//   const basePath = `places/${placeId}`;
//   const results = {
//     mainImage: null,
//     galleryImages: [],
//     errors: [],
//   };

//   // Upload main image
//   if (mainImageUri) {
//     const mainResult = await uploadImage(mainImageUri, `${basePath}/main.jpg`);
//     if (mainResult.url) {
//       results.mainImage = mainResult.url;
//     } else {
//       results.errors.push(`Main image: ${mainResult.error}`);
//     }
//   }

//   // Upload gallery images
//   if (galleryImageUris.length > 0) {
//     const galleryResults = await uploadMultipleImages(
//       galleryImageUris,
//       `${basePath}/gallery`
//     );
//     results.galleryImages = galleryResults.urls;
//     results.errors.push(...galleryResults.errors);
//   }

//   return results;
// };

// /**
//  * Upload review image
//  */
// export const uploadReviewImage = async (imageUri, reviewId) => {
//   const path = `reviews/${reviewId}/image.jpg`;
//   return await uploadImage(imageUri, path);
// };

