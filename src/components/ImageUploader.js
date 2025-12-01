import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickImage, pickMultipleImages } from '../services/upload';

/**
 * Image Uploader Component
 * Handles single or multiple image selection
 */
export const ImageUploader = ({
  onImagesSelected,
  multiple = false,
  maxImages = 10,
  existingImages = [],
}) => {
  const [images, setImages] = useState(existingImages);

  const handlePickImage = async () => {
    if (multiple) {
      const selectedImages = await pickMultipleImages(maxImages);
      if (selectedImages && selectedImages.length > 0) {
        const newImages = [...images, ...selectedImages].slice(0, maxImages);
        setImages(newImages);
        onImagesSelected(newImages);
      }
    } else {
      const selectedImage = await pickImage();
      if (selectedImage) {
        const newImages = [selectedImage];
        setImages(newImages);
        onImagesSelected(newImages);
      }
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesSelected(newImages);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePickImage}
          activeOpacity={0.7}
        >
          <Ionicons name="camera" size={32} color="#007AFF" />
          <Text style={styles.uploadText}>
            {images.length === 0 ? 'Add Image' : 'Add More'}
          </Text>
        </TouchableOpacity>

        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: image.uri }}
              style={styles.image}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
            {index === 0 && images.length > 1 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {images.length > 0 && (
        <Text style={styles.hint}>
          {images.length === 1
            ? 'First image will be used as main image'
            : `First image is main (${images.length}/${maxImages})`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  uploadButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#f9f9f9',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

