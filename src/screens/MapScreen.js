import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getNearbySpots } from '../services/spots.service';
import { useLocation } from '../hooks/useLocation';
import { cleanMapStyle } from "../utils/mapStyle";
import { Animated, Easing } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRef, useMemo, useCallback } from "react";


export const MapScreen = ({ navigation }) => {
  const { location, loading: locationLoading, error } = useLocation();
  const [spots, setSpots] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownHeight] = useState(new Animated.Value(0));
  const [selectedSpot, setSelectedSpot] = useState(null);

  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ["25%", "45%"], []);

  const openBottomSheet = useCallback((spot) => {
    setSelectedSpot(spot);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedSpot(null);
  };


  const toggleDropdown = () => {
    if (dropdownOpen) {
      Animated.timing(dropdownHeight, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setDropdownOpen(false));
    } else {
      setDropdownOpen(true);
      Animated.timing(dropdownHeight, {
        toValue: 200,   // dropdown max height
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const centerOnSpot = (spot) => {
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
  
    setMapRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  
    toggleDropdown(); // closes dropdown
  };
  
  
  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      loadNearby();
    }
  }, [location]);
  const loadNearby = async () => {
    try {
      const data = await getNearbySpots(location.latitude, location.longitude, 5000);
      if (!data.error) {
        setSpots(data);
      } else {
        Alert.alert("Nearby Spots", data.error);
      }
    } catch (err) {
      console.error("Error loading nearby spots:", err);
    }
  };

  const centerOnUser = () => {
    if (!location) {
      Alert.alert('Location', 'Unable to get your location');
      return;
    }

    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  if (locationLoading || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <MapView
      style={styles.map}
      region={mapRegion}
      onRegionChangeComplete={setMapRegion}
      customMapStyle={cleanMapStyle} 
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsPointsOfInterest={false} 
      showsBuildings={false}
      showsIndoorLevelPicker={false}
      toolbarEnabled={false}
    >
      {spots.map((spot) => (
        <Marker
        key={spot.id}
        coordinate={{
          latitude: spot.lat,
          longitude: spot.lng,
        }}
        onPress={() => openBottomSheet(spot)}
      >
        <View style={{
          alignItems: "center",
        }}>
          {/* Pin head */}
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            // backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            elevation: 3,
            shadowColor: "#000",
            // shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
          }}>
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 80, height: 80 }}
              resizeMode="cover"
            />
          </View>
      
          {/* Pin pointer */}
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderTopWidth: 15,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: "#fff",
            marginTop: -1,
          }} />
        </View>
      </Marker>      
      
      
      ))}
    </MapView>


      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.infoBar}>
        <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownHeader}>
          <Text style={styles.infoText}>
            {spots.length} {spots.length === 1 ? "spot" : "spots"} nearby
          </Text>
          <Ionicons
            name={dropdownOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>

        <Animated.View style={[styles.dropdown, { height: dropdownHeight }]}>
          {spots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={styles.dropdownItem}
              onPress={() => centerOnSpot(spot)}
            >
              <Text style={styles.dropdownTitle}>{spot.title}</Text>
              <Text style={styles.dropdownAddress}>{spot.address}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        onClose={closeBottomSheet}
      >
        {selectedSpot && (
          <BottomSheetView style={styles.sheetContent}>
            
            {/* Thumbnail */}
            <Image
              source={{ uri: selectedSpot.thumbnail }}
              style={styles.sheetImage}
            />

            {/* Title + Category */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{selectedSpot.title}</Text>

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {selectedSpot.category}
                </Text>
              </View>
            </View>

            {/* Address */}
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.sheetAddress}>
                {selectedSpot.address}
              </Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {selectedSpot.tags?.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                closeBottomSheet();
                navigation.navigate("SpotDetail", {
                  spotId: selectedSpot.id,
                });
              }}
            >
              <Text style={styles.detailsButtonText}>
                View details
              </Text>
            </TouchableOpacity>

          </BottomSheetView>
        )}
      </BottomSheet>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: { flex: 1 },
  centerButton: {
    position: "absolute",
    bottom: 100,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  infoBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  dropdown: {
    overflow: "hidden",
    marginTop: 8,
  },
  
  dropdownItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  
  dropdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  
  dropdownAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: {
    backgroundColor: "#ddd",
    width: 40,
  },
  sheetContent: {
    padding: 16,
  },
  sheetImage: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
    textTransform: "capitalize",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sheetAddress: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#444",
  },
  detailsButton: {
    marginTop: 12,
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  
});
