import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getAllPlaces, getNearbyPlaces } from '../services/places';
import { useLocation } from '../hooks/useLocation';

/**
 * Map Screen
 * Displays places on a map
 */
export const MapScreen = ({ navigation }) => {
  const { location, loading: locationLoading } = useLocation();
  const [places, setPlaces] = useState([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      loadNearbyPlaces();
    }
  }, [location]);

  const loadPlaces = async () => {
    try {
      const data = await getAllPlaces();
      setPlaces(data);
    } catch (error) {
      console.error('Error loading places:', error);
    }
  };

  const loadNearbyPlaces = async () => {
    if (!location) return;
    try {
      const data = await getNearbyPlaces(location.latitude, location.longitude, 10);
      setPlaces(data);
    } catch (error) {
      console.error('Error loading nearby places:', error);
    }
  };

  const centerOnUser = () => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } else {
      Alert.alert('Location', 'Unable to get your location');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.title}
            description={place.category}
            onCalloutPress={() =>
              navigation.navigate('PlaceDetail', { placeId: place.id })
            }
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {places.length} {places.length === 1 ? 'place' : 'places'} nearby
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

