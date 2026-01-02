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
import { useSpotVibes } from "../hooks/useSpotVibes";

const safeHex = (color, fallback = "#1f1f1f") => {
  if (!color) return fallback;
  if (/^#([0-9A-F]{6})$/i.test(color)) return color;
  return fallback;
};

const hexToRgba = (hex, alpha = 1) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const MapScreen = ({ navigation }) => {
  const { location, loading: locationLoading, error } = useLocation();
  const [spots, setSpots] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownHeight] = useState(new Animated.Value(0));
  const [selectedSpot, setSelectedSpot] = useState(null);

  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ["25%", "45%"], []);
  const spotId = selectedSpot?.id;

  const { data: spotVibes = [] } = useSpotVibes(spotId, {
    enabled: !!spotId,
  });
  

  const topVibe =
    spotVibes.length > 0
      ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
      : null;

  const vibeColor = safeHex(topVibe?.color, "#242424");
  const vibeBg = hexToRgba(vibeColor, 0.85);   // soft background
  const vibeSoft = hexToRgba(vibeColor, 0.15);
  const vibeStrong = hexToRgba(vibeColor, 1);
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
          backgroundStyle={{
            backgroundColor: vibeBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
          handleIndicatorStyle={{
            backgroundColor: vibeStrong,
            width: 48,
            height: 5,
          }}
          onClose={closeBottomSheet}
        >

        {selectedSpot && (
          <BottomSheetView style={styles.sheetContent}>

          {/* HERO IMAGE */}
          <Image
            source={{ uri: selectedSpot.thumbnail }}
            style={[
              styles.sheetImage,
              { borderColor: vibeSoft, borderWidth: 1 }
            ]}
          />
        
          {/* TITLE + VIBE BADGE */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{selectedSpot.title}</Text>
        
            <View style={[
              styles.categoryBadge,
              { backgroundColor: vibeStrong }
            ]}>
              <Text style={styles.categoryText}>
                {topVibe?.name || selectedSpot.category}
              </Text>
            </View>
          </View>
        
          {/* ADDRESS */}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.sheetAddress}>
              {selectedSpot.address}
            </Text>
          </View>
        
          {/* QUICK STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="walk-outline" size={18} color={vibeStrong} />
              <Text style={styles.statText}>
                {selectedSpot.distanceKm?.toFixed(2)} km
              </Text>
            </View>
        
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={vibeStrong} />
              <Text style={styles.statText}>
                ~{Math.max(1, selectedSpot.approxTimeMin.toFixed(0))} min
              </Text>
            </View>
        
            <View style={styles.statItem}>
              <Ionicons name="pricetag-outline" size={18} color={vibeStrong} />
              <Text style={styles.statText}>
                {selectedSpot.priceRange}
              </Text>
            </View>
          </View>
        
          {/* DESCRIPTION */}
          <Text style={styles.description}>
            {selectedSpot.description}
          </Text>
        
          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.detailsButton,
              { backgroundColor: vibeStrong }
            ]}
            onPress={() => {
              closeBottomSheet();
              navigation.navigate("SpotDetail", {
                spotId: selectedSpot.id,
              });
            }}
          >
            <Text style={styles.detailsButtonText}>
              Explore this spot
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
    color: "#fff"

  },
  categoryBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    textTransform: "capitalize",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sheetAddress: {
    fontSize: 13,
    marginLeft: 4,
    color: "#fff"
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
    color: "#fff"
  },
  detailsButton: {
    marginTop: 12,
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    elevation: 5
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
  },
  
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  
  statText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    marginTop: 10,
    fontWeight:"600"
  },
  
});
