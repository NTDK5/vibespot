import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '../components/Button';
import { ImageUploader } from '../components/ImageUploader';
import { addSpot } from '../services/spots';
import { uploadSpotImages } from '../services/upload';
import { useLocation } from '../hooks/useLocation';
import { CATEGORIES, PRICE_RANGES } from '../utils/constants';

/**
 * Add Spot Screen (Admin Only)
 */
export const AddSpotScreen = ({ navigation }) => {
  const { location } = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState(0);
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);
  const [latitude, setLatitude] = useState(location?.latitude || 37.78825);
  const [longitude, setLongitude] = useState(location?.longitude || -122.4324);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState('');
  const [bestTime, setBestTime] = useState('');


  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Error", "Please enter a title");
    if (!description.trim()) return Alert.alert("Error", "Please enter a description");
    if (!category) return Alert.alert("Error", "Please select a category");
    // if (images.length === 0) return Alert.alert("Error", "Please add at least one image");
  
    setSubmitting(true);
  
    try {
      const spotData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priceRange,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        // latitude,
        // longitude,
        address,
        bestTime
      };
  
      // Step 1 — Create spot
      const { id: spotId, error: spotError } = await addSpot(spotData);

      console.log(spotId)
  
      if (spotError || !spotId) {
        throw new Error(spotError || "Spot ID missing");
      }
  
      // Step 2 — Upload images
      const uploadResult = await uploadSpotImages(spotId, images);
  
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }
  
      Alert.alert("Success", "Spot added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add spot");
    } finally {
      setSubmitting(false);
    }
  };
  

  const handleMapPress = (event) => {
    const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
  };

  const selectedCategoryLabel = CATEGORIES.find((c) => c.id === category)?.label || 'Select Category';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          spotholder="Enter spot title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          spotholder="Describe the spot..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={styles.selectButtonText}>{selectedCategoryLabel}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Price Range</Text>
        <View style={styles.priceRangeContainer}>
          {PRICE_RANGES.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.priceRangeButton,
                priceRange === range.value && styles.priceRangeButtonActive,
              ]}
              onPress={() => setPriceRange(range.value)}
            >
              <Text
                style={[
                  styles.priceRangeText,
                  priceRange === range.value && styles.priceRangeTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.input}
          spotholder="e.g., outdoor, scenic, quiet"
          value={tags}
          onChangeText={setTags}
        />
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter address"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Best Time To Visit (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Morning, Weekend, Sunset"
          value={bestTime}
          onChangeText={setBestTime}
        />

        <Text style={styles.label}>Images *</Text>
        <ImageUploader
          onImagesSelected={setImages}
          multiple={true}
          maxImages={10}
        />

        <Text style={styles.label}>Location</Text>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setMapModalVisible(true)}
        >
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.mapButtonText}>
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <Button
          title="Add Spot"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
      </View>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  category === cat.id && styles.categoryOptionActive,
                ]}
                onPress={() => {
                  setCategory(cat.id);
                  setCategoryModalVisible(false);
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={category === cat.id ? '#007AFF' : '#666'}
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === cat.id && styles.categoryOptionTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {category === cat.id && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Map Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              draggable
              onDragEnd={(e) => {
                setLatitude(e.nativeEvent.coordinate.latitude);
                setLongitude(e.nativeEvent.coordinate.longitude);
              }}
            />
          </MapView>
          <View style={styles.mapModalFooter}>
            <Button
              title="Confirm Location"
              onPress={() => setMapModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priceRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  priceRangeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priceRangeText: {
    fontSize: 14,
    color: '#666',
  },
  priceRangeTextActive: {
    color: '#fff',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  mapButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  categoryOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  categoryOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  mapModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

