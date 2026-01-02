import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getNearbySpots, getSurpriseMeSpot } from '../services/spots.service';
import { useLocation } from '../hooks/useLocation';
import { cleanMapStyle } from "../utils/mapStyle";
import { Animated, Easing, Modal } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRef, useMemo, useCallback } from "react";
import { useSpotVibes } from "../hooks/useSpotVibes";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";

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
  const [surpriseSpot, setSurpriseSpot] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const isRegionChanging = useRef(false);
  const shouldUpdateRegion = useRef(true);

  // Reanimated values for advanced animations
  const revealProgress = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const particleScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const spotCardScale = useSharedValue(0);
  const spotCardRotation = useSharedValue(0);

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
  
    shouldUpdateRegion.current = true;
    isRegionChanging.current = true;
    setMapRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  
    toggleDropdown(); // closes dropdown
    setTimeout(() => {
      isRegionChanging.current = false;
    }, 500);
  };
  
  
  useEffect(() => {
    if (location && !mapRegion) {
      shouldUpdateRegion.current = true;
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

    shouldUpdateRegion.current = true;
    isRegionChanging.current = true;
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setTimeout(() => {
      isRegionChanging.current = false;
    }, 500);
  };

  const handleSurpriseMe = async () => {
    try {
      setRevealing(true);
      setShowRevealModal(true);
      
      // Reset animations for new reveal
      revealProgress.value = 0;
      particleScale.value = 0;
      spotCardScale.value = 0;
      spotCardRotation.value = -10;
      pulseAnim.setValue(1);
      revealAnim.setValue(0);
      scaleAnim.setValue(0);
      
      // Start sparkle rotation animation
      sparkleRotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );

      // Show modal with fade in
      modalOpacity.value = withTiming(1, { duration: 300 });

      const spot = await getSurpriseMeSpot();
      
      if (spot.error) {
        Alert.alert("Error", spot.error);
        setRevealing(false);
        setShowRevealModal(false);
        modalOpacity.value = withTiming(0, { duration: 300 });
        return;
      }

      setSurpriseSpot(spot);

      // Stage 1: Particle explosion
      particleScale.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1.5, { duration: 300 }),
        withTiming(0, { duration: 200 })
      );

      // Stage 2: Reveal progress
      revealProgress.value = withTiming(1, { 
        duration: 1500 
      }, (finished) => {
        if (finished) {
          'worklet';
          spotCardScale.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
          });
          spotCardRotation.value = withSpring(0, {
            damping: 10,
            stiffness: 100,
          });
        }
      });

      // Center map on surprise spot
      if (spot.lat && spot.lng) {
        setTimeout(() => {
          shouldUpdateRegion.current = true;
          isRegionChanging.current = true;
          setMapRegion({
            latitude: spot.lat,
            longitude: spot.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setTimeout(() => {
            isRegionChanging.current = false;
          }, 500);
        }, 500);
      }

      // Start pulse animation for map marker
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Reveal animation for marker
      Animated.parallel([
        Animated.timing(revealAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Close modal and open bottom sheet after reveal (increased from 3s to 6s)
      setTimeout(() => {
        modalOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
          if (finished) {
            'worklet';
            runOnJS(setShowRevealModal)(false);
            runOnJS(openBottomSheet)(spot);
            runOnJS(setRevealing)(false);
          }
        });
      }, 6000);
    } catch (error) {
      console.error("Surprise me error:", error);
      Alert.alert("Error", "Failed to get surprise spot");
      setRevealing(false);
      setShowRevealModal(false);
      modalOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  // Animated styles for reveal modal
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
    };
  });

  const sparkleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${sparkleRotation.value}deg` }],
    };
  });

  const particleAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      particleScale.value,
      [0, 1, 1.5],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      particleScale.value,
      [0, 1, 1.5],
      [1, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const revealCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      revealProgress.value,
      [0, 1],
      [0, 3],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      revealProgress.value,
      [0, 0.5, 1],
      [0.8, 0.4, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const spotCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: spotCardScale.value },
        { rotate: `${spotCardRotation.value}deg` },
      ],
      opacity: spotCardScale.value,
    };
  });

  const handleRegionChangeComplete = useCallback((region) => {
    // Only update state if we're not in the middle of a programmatic region change
    // This prevents the map from vibrating due to constant re-renders
    if (!isRegionChanging.current && shouldUpdateRegion.current) {
      shouldUpdateRegion.current = false;
      setMapRegion(region);
    }
  }, []);

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
      ref={mapRef}
      style={styles.map}
      region={mapRegion}
      onRegionChangeComplete={handleRegionChangeComplete}
      customMapStyle={cleanMapStyle} 
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsPointsOfInterest={false} 
      showsBuildings={false}
      showsIndoorLevelPicker={false}
      toolbarEnabled={false}
      moveOnMarkerPress={false}
    >
      {spots.map((spot) => {
        const isSurpriseSpot = surpriseSpot?.id === spot.id;
        return (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.lat,
              longitude: spot.lng,
            }}
            onPress={() => openBottomSheet(spot)}
          >
            <Animated.View
              style={{
                alignItems: "center",
                transform: isSurpriseSpot ? [
                  { scale: pulseAnim },
                  { scale: scaleAnim }
                ] : [],
                opacity: isSurpriseSpot ? revealAnim : 1,
              }}
            >
              {/* Pulse rings for surprise spot */}
              {isSurpriseSpot && (
                <>
                  <Animated.View
                    style={{
                      position: "absolute",
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: vibeColor,
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.3],
                        outputRange: [0.6, 0],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [1, 1.3],
                            outputRange: [1, 2],
                          }),
                        },
                      ],
                    }}
                  />
                  <Animated.View
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      borderWidth: 2,
                      borderColor: vibeColor,
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.3],
                        outputRange: [0.4, 0],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [1, 1.3],
                            outputRange: [1, 2.5],
                          }),
                        },
                      ],
                    }}
                  />
                </>
              )}
              {/* Pin head */}
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                elevation: 3,
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 2,
                backgroundColor: isSurpriseSpot ? vibeColor : "transparent",
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
                borderTopColor: isSurpriseSpot ? vibeColor : "#fff",
                marginTop: -1,
              }} />
            </Animated.View>
          </Marker>
        );
      })}
    </MapView>


      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      {/* Surprise Me Button */}
      <TouchableOpacity
        style={[styles.surpriseButton, { backgroundColor: vibeColor }]}
        onPress={handleSurpriseMe}
        disabled={revealing}
      >
        {revealing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.surpriseButtonText}>Surprise Me!</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Advanced Reveal Modal */}
      <Modal
        visible={showRevealModal}
        transparent
        animationType="none"
        onRequestClose={() => {
          setShowRevealModal(false);
          setRevealing(false);
        }}
      >
        <Reanimated.View style={[styles.revealModalContainer, modalAnimatedStyle]}>
          {/* Background gradient overlay */}
          <View style={styles.revealModalBackground} />

          {/* Particle effects */}
          {[...Array(20)].map((_, i) => {
            const angle = (i * 360) / 20;
            const distance = 150;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            
            return (
              <Reanimated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    left: '50%',
                    top: '50%',
                    marginLeft: x,
                    marginTop: y,
                  },
                  particleAnimatedStyle,
                ]}
              >
                <Ionicons name="star" size={12} color={vibeColor} />
              </Reanimated.View>
            );
          })}

          {/* Expanding reveal circles */}
          <Reanimated.View style={[styles.revealCircle, revealCircleStyle, { borderColor: vibeColor }]} />
          <Reanimated.View style={[styles.revealCircle, revealCircleStyle, { borderColor: vibeColor, borderWidth: 3 }]} />

          {/* Sparkle icon */}
          <Reanimated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
            <Ionicons name="sparkles" size={80} color={vibeColor} />
          </Reanimated.View>

          {/* Revealed spot card */}
          {surpriseSpot && (
            <Reanimated.View style={[styles.revealedSpotCard, spotCardAnimatedStyle]}>
              <Image
                source={{ uri: surpriseSpot.thumbnail || surpriseSpot.images?.[0] }}
                style={styles.revealedSpotImage}
              />
              <View style={[styles.revealedSpotOverlay, { backgroundColor: hexToRgba(vibeColor, 0.9) }]}>
                <Text style={styles.revealedSpotTitle}>{surpriseSpot.title}</Text>
                <View style={styles.revealedSpotBadge}>
                  <Ionicons name="location" size={16} color="#fff" />
                  <Text style={styles.revealedSpotAddress} numberOfLines={1}>
                    {surpriseSpot.address}
                  </Text>
                </View>
              </View>
            </Reanimated.View>
          )}

          {/* Loading text */}
          {!surpriseSpot && (
            <Text style={styles.revealLoadingText}>Discovering your surprise...</Text>
          )}
        </Reanimated.View>
      </Modal>

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
                {selectedSpot.distanceKm ? selectedSpot.distanceKm.toFixed(2) : '0.00'} km
              </Text>
            </View>
        
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={vibeStrong} />
              <Text style={styles.statText}>
                ~{selectedSpot.approxTimeMin ? Math.max(1, selectedSpot.approxTimeMin.toFixed(0)) : '1'} min
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
  surpriseButton: {
    position: "absolute",
    bottom: 100,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  surpriseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
  revealModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  revealModalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  particle: {
    position: "absolute",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  revealCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
  },
  sparkleContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  revealedSpotCard: {
    width: 300,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    zIndex: 20,
    marginTop: 100,
  },
  revealedSpotImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  revealedSpotOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  revealedSpotTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  revealedSpotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  revealedSpotAddress: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  revealLoadingText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginTop: 200,
    zIndex: 15,
  },
});
