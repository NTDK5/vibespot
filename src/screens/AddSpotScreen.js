import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { ImageUploader } from '../components/ImageUploader';
import { addSpot } from '../services/spots.service';
import { uploadSpotImages } from '../services/upload';
import { useLocation } from '../hooks/useLocation';
import { CATEGORIES, PRICE_RANGES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState([]);
  const [lat, setLatitude] = useState(location?.latitude ?? 37.78825);
  const [lng, setLongitude] = useState(location?.longitude ?? -122.4324);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { isSuperAdmin } = useAuth();



  useEffect(() => {
    if (!isSuperAdmin) {
      navigation.replace('Home');
    }
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    setLatitude(location.latitude);
    setLongitude(location.longitude);

    }}, [location, isSuperAdmin]);




  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
  
    setFeatures([...features, trimmed]);
    setFeatureInput('');
  };
  
  const removeFeature = (feature) => {
    setFeatures(features.filter(f => f !== feature));
  };
  

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
        lat,
        lng,
        address,
        bestTime,
        features,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        twitter: twitter.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };
  
      // Step 1 — Create spot
      const { id: spotId, error: spotError } = await addSpot(spotData);

  
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Spot</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Title Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <Text style={styles.label}>Title *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter spot title"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <Text style={styles.label}>Description *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the spot..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Category & Pricing</Text>
            </View>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectButtonContent}>
                <Ionicons name="pricetag-outline" size={20} color="#6C5CE7" />
                <Text style={styles.selectButtonText}>{selectedCategoryLabel}</Text>
              </View>
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
                  activeOpacity={0.7}
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
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Features</Text>
            </View>
            <View style={styles.featureInputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Add feature e.g. WiFi, Parking"
                  placeholderTextColor="#999"
                  value={featureInput}
                  onChangeText={setFeatureInput}
                  onSubmitEditing={addFeature}
                />
              </View>
              <TouchableOpacity
                onPress={addFeature}
                style={styles.addFeatureButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Selected Features */}
            {features.length > 0 && (
              <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureChip}>
                    <Text style={styles.featureChipText}>{feature}</Text>
                    <TouchableOpacity onPress={() => removeFeature(feature)}>
                      <Ionicons name="close-circle" size={18} color="#6C5CE7" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Location Details</Text>
            </View>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter full address"
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <Text style={styles.label}>Coordinates</Text>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => setMapModalVisible(true)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6C5CE7', '#A29BFE']}
                style={styles.mapButtonGradient}
              >
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.mapButtonText}>
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.label}>Best Time To Visit (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning, Weekend, Sunset"
                placeholderTextColor="#999"
                value={bestTime}
                onChangeText={setBestTime}
              />
            </View>
          </View>

          {/* Tags Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetags-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Tags</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., outdoor, scenic, quiet (comma-separated)"
                placeholderTextColor="#999"
                value={tags}
                onChangeText={setTags}
              />
            </View>
          </View>

          {/* Contact & Social Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Contact & Social Media</Text>
            </View>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. +1234567890"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="contact@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Website</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                placeholderTextColor="#999"
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Instagram</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://instagram.com/username"
                placeholderTextColor="#999"
                value={instagram}
                onChangeText={setInstagram}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Facebook</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://facebook.com/username"
                placeholderTextColor="#999"
                value={facebook}
                onChangeText={setFacebook}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Twitter/X</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://twitter.com/username"
                placeholderTextColor="#999"
                value={twitter}
                onChangeText={setTwitter}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Images</Text>
            </View>
            <ImageUploader
              onImagesSelected={setImages}
              multiple={true}
              maxImages={10}
            />
          </View>

          <Button
            title="Create Spot"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitButton}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
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
        </ScrollView>
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
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
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
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  inputContainer: {
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: 'transparent',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceRangeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  priceRangeButtonActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  priceRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priceRangeTextActive: {
    color: '#fff',
  },
  featureInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  addFeatureButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  featureChipText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
  },
  mapButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  mapButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#6C5CE7',
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: '#6C5CE7',
    fontWeight: '700',
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

