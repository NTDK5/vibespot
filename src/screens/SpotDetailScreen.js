import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Carousel from "react-native-snap-carousel";
import Icon from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome5";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSpotById } from '../services/spots.service';
import { Platform } from "react-native";
import { Linking } from "react-native";
import { useVibes } from "../hooks/useVibes";
import { useSpotVibes } from "../hooks/useSpotVibes";
import { useMySpotVibes } from "../hooks/useMySpotVibes";
import { useUpdateSpotVibes } from "../hooks/useUpdateSpotVibes";
import { Modal, TextInput, Alert } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { getSpotComments, createComment, deleteComment } from "../services/comments.service";
import { saveSpot, unsaveSpot, isSpotSaved } from "../services/savedSpots.service";
import { markSpotAsVisited, isSpotVisited } from "../services/visitedSpots.service";
import { useLocation } from "../hooks/useLocation";
import * as Location from 'expo-location';
import { luminance, hexToRgb, mix, createVibeTheme } from '../utils/colors'
import { useTheme } from "../context/ThemeContext";
import { useColorScheme } from "react-native";


const { width } = Dimensions.get("window");

const lightColor = (hex, opacity = 0.15) => {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};
const getVibeSurface = (vibeColor, theme) => {
  if (!vibeColor) return theme.surface;

  const lum = luminance(hexToRgb(vibeColor));

  // If vibe is bright → darken it
  if (lum > 0.55) {
    return mix(vibeColor, theme.background, 0.65);
  }

  // If vibe is already dark → soften slightly
  return mix(vibeColor, theme.background, 0.35);
};

export default function SpotDetailsScreen({ route, navigation }) {
  const carouselRef = useRef(null);

  const { spotId } = route.params;
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  // --- VIBES (REAL DATA) ---
  const { data: allVibes = [] } = useVibes();
  const { data: spotVibes = [] } = useSpotVibes(spotId);
  const { data: myVibes = [] } = useMySpotVibes(spotId);
  const updateVibes = useUpdateSpotVibes(spotId);
  const [vibeModalVisible, setVibeModalVisible] = useState(false);
  const { theme, isDark } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const { user, isSuperAdmin } = useAuth();

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Saved spot state
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Visited spot state
  const [isVisited, setIsVisited] = useState(false);
  const [checkingVisited, setCheckingVisited] = useState(false);
  const [countdown, setCountdown] = useState(0); // in seconds
  const [countdownActive, setCountdownActive] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const countdownIntervalRef = useRef(null);
  const locationWatchRef = useRef(null);
  const { location, refresh: refreshLocation } = useLocation();



  const openMap = () => {
    if (!spot?.lat || !spot?.lng) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${spot.lat},${spot.lng}`,
      android: `geo:0,0?q=${spot.lat},${spot.lng}`,
    });

    Linking.openURL(url);
  };

  useEffect(() => {
    const fetchSpot = async () => {
      const data = await getSpotById(spotId);

      if (!data || data.error) {
        setSpot(null);
      } else {
        setSpot(data);
      }
      setLoading(false);
    };

    fetchSpot();
  }, [spotId]);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, spotId]);

  useEffect(() => {
    if (user && spotId) {
      checkIfSaved();
      checkIfVisited();
    }
  }, [user, spotId]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (locationWatchRef.current) {
        Location.stopLocationUpdatesAsync(locationWatchRef.current);
      }
    };
  }, []);

  const checkIfSaved = async () => {
    const saved = await isSpotSaved(spotId);
    setIsSaved(saved);
  };

  const checkIfVisited = async () => {
    if (!user) return;
    const visited = await isSpotVisited(spotId);
    setIsVisited(visited);
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleMarkAsVisited = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to mark spots as visited");
      return;
    }

    if (!spot?.lat || !spot?.lng) {
      Alert.alert("Error", "Spot location is not available");
      return;
    }

    if (!location) {
      Alert.alert("Location Required", "Please enable location services");
      return;
    }

    // Check if user is within 1km radius
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      spot.lat,
      spot.lng
    );

    if (distance > 1000) {
      Alert.alert(
        "Too Far Away",
        `You need to be within 1km of the spot. You are currently ${(distance / 1000).toFixed(2)}km away.`
      );
      return;
    }

    // Start countdown and location monitoring
    setCountdownActive(true);
    setCountdown(180); // 3 minutes = 180 seconds
    setLocationError(null);
    setCheckingVisited(true);

    // Start countdown timer
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          handleCountdownComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start location watching
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required");
        stopCountdown();
        return;
      }

      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Check every 5 seconds
          distanceInterval: 10, // Check if moved 10 meters
        },
        (currentLocation) => {
          const currentDistance = calculateDistance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            spot.lat,
            spot.lng
          );

          // If user moves outside 1km radius, stop countdown
          if (currentDistance > 1000) {
            Alert.alert(
              "Location Changed",
              "You moved too far from the spot. Countdown cancelled."
            );
            stopCountdown();
          }
        }
      );
    } catch (error) {
      console.error("Location watch error:", error);
      setLocationError("Failed to monitor location");
    }
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
    setCountdownActive(false);
    setCountdown(0);
    setCheckingVisited(false);
  };

  const handleCountdownComplete = async () => {
    stopCountdown();

    // Final location check
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        spot.lat,
        spot.lng
      );

      if (distance > 1000) {
        Alert.alert(
          "Verification Failed",
          "You are no longer within 1km of the spot."
        );
        return;
      }

      // Mark as visited
      const result = await markSpotAsVisited(spotId);
      if (!result.error) {
        setIsVisited(true);
        Alert.alert("Success!", "Spot marked as visited! 🎉");
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify location");
    } finally {
      setCheckingVisited(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveToggle = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to save spots");
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        const result = await unsaveSpot(spotId);
        if (!result.error) {
          setIsSaved(false);
        } else {
          Alert.alert("Error", result.error);
        }
      } else {
        const result = await saveSpot(spotId);
        if (!result.error) {
          setIsSaved(true);
        } else {
          Alert.alert("Error", result.error);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update saved status");
    } finally {
      setSaving(false);
    }
  };

  // Reset selectedVibes to user's existing vibes when modal opens
  useEffect(() => {
    if (vibeModalVisible) {
      // Always reset to user's existing vibes when modal opens
      const existingVibes = Array.isArray(myVibes) ? myVibes : [];
      setSelectedVibes([...existingVibes]);
    }
  }, [vibeModalVisible]);

  const loadComments = async () => {
    setLoadingComments(true);
    const result = await getSpotComments(spotId);
    if (!result.error) {
      setComments(result.comments || []);
    }
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!user?.id) {
      Alert.alert("Login Required", "Please login to add a comment");
      return;
    }

    const result = await createComment(spotId, commentText, user.id);
    if (!result.error) {
      setCommentText("");
      loadComments();
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteComment(spotId, commentId);
            if (!result.error) {
              loadComments();
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: topVibe
            ? getVibeSurface(topVibe.color, theme)
            : theme.background

        }}
      >
        <ActivityIndicator size="large" color="#ff9900" />
      </View>
    );
  }

  if (!spot) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700" }}>
          Spot not found.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 20,
            backgroundColor: "#ffd54f",
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const topVibe = spotVibes.length > 0
    ? spotVibes.reduce((prev, current) => (current.count > prev.count ? current : prev))
    : null;
  const vibeTheme = topVibe
    ? createVibeTheme(topVibe.color, theme, isDark)
    : null;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: vibeTheme ? vibeTheme.background : theme.background }
    ]}>
      {/* ---------- TOP HEADER ---------- */}
      <View style={[styles.header, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: vibeTheme ? vibeTheme.headerIcon : theme.surface }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={vibeTheme ? theme.text : theme.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {spot.title}
          </Text>
          <View style={styles.headerRatingRow}>
            {/* ---------- TOP VIBE ---------- */}
            {topVibe && (
              <View style={[styles.topVibe, { backgroundColor: topVibe.color }]}>
                <FontAwesome
                  name={topVibe.icon}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.topVibeText}>{topVibe.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('EditSpot', { spotId: spot.id })}
            >
              <Icon name="create-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: vibeTheme ? vibeTheme.headerIcon : theme.surface }]}>
            <Icon name="share-social-outline" size={22} color={vibeTheme ? theme.text : theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 90 }}>
        {/* ---------- HERO / CAROUSEL ---------- */}
        <View style={styles.hero}>
          <Carousel
            ref={carouselRef}
            data={spot.images || []}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.heroImage} />
            )}
            sliderWidth={width}
            itemWidth={width}
            firstItem={activeIndex}
            onSnapToItem={(index) => setActiveIndex(index)}
          />


          {/* Gradient overlay */}
          <View style={styles.heroOverlay} />

          {/* Title overlay */}
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{spot.title}</Text>
            <View style={styles.heroMeta}>
              <Icon name="location-outline" size={14} color="#eee" />
              <Text style={styles.heroAddress}>{spot.address}</Text>
            </View>
          </View>

          {/* Like */}
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => setLiked(!liked)}
          >
            <Icon
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? "#ff5a5f" : "#fff"}
            />
          </TouchableOpacity>
        </View>



        <View style={[styles.storyCard, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
          <Text style={[styles.storyTitle, { color: theme.text }]}>The Vibe</Text>

          <Text style={[styles.storyText, { color: theme.text }]} numberOfLines={showMore ? 20 : 4}>
            {spot.description}
          </Text>

          <TouchableOpacity onPress={() => setShowMore(!showMore)}>
            <Text style={[styles.readMore, { color: vibeTheme ? vibeTheme.primary : theme.primary }]}>
              {showMore ? "Show less" : "Read the story"}
            </Text>
          </TouchableOpacity>
        </View>


        {/* ---------- IMAGE GALLERY THUMBNAILS ---------- */}
        {spot.images?.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbRow}
          >
            {spot.images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setActiveIndex(index);
                  carouselRef.current?.snapToItem(index);
                }}
              >
                <Image
                  source={{ uri: img }}
                  style={[
                    styles.thumb,
                    activeIndex === index && styles.thumbActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={[styles.quickInfoContainer, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Icon name="grid-outline" size={18} color={vibeTheme ? vibeTheme.primary : theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.text }]}>Category</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {spot.category?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Icon name="time-outline" size={18} color={vibeTheme ? vibeTheme.primary : theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.text }]}>Best Time</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{spot.bestTime}</Text>
            </View>

            <View style={styles.infoItem}>
              <Icon name="pricetag-outline" size={18} color={vibeTheme ? vibeTheme.primary : theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.text }]}>Price</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {spot.priceRange?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: theme.text, textAlign: "center", paddingTop: 16, fontSize: 18, fontWeight: "bold" }}>Tags</Text>
          {/* ---------- TAGS ---------- */}
          {spot.tags && spot.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {spot.tags.map((tag, i) => (
                <View key={i} style={[styles.tagChip, { backgroundColor: topVibe ? topVibe.color : theme.primary }]}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>






        {/* ---------- FEATURES ---------- */}
        <View style={[styles.section, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Features</Text>

          {(spot.features || []).map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: topVibe ? topVibe.color : theme.primary }]}>
                <Icon name="checkmark" size={22} color="#fff" />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* ---------- CONTACT & SOCIAL ---------- */}
        {(spot.phone || spot.email || spot.website || spot.instagram || spot.facebook || spot.twitter) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Social Media</Text>

            {spot.phone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${spot.phone}`)}
              >
                <Icon name="call-outline" size={20} color="#6C5CE7" />
                <Text style={styles.contactText}>{spot.phone}</Text>
              </TouchableOpacity>
            )}

            {spot.email && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${spot.email}`)}
              >
                <Icon name="mail-outline" size={20} color="#6C5CE7" />
                <Text style={styles.contactText}>{spot.email}</Text>
              </TouchableOpacity>
            )}

            {spot.website && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(spot.website)}
              >
                <Icon name="globe-outline" size={20} color="#6C5CE7" />
                <Text style={styles.contactText}>{spot.website}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.socialRow}>
              {spot.instagram && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(spot.instagram)}
                >
                  <Icon name="logo-instagram" size={24} color="#E4405F" />
                </TouchableOpacity>
              )}
              {spot.facebook && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(spot.facebook)}
                >
                  <Icon name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
              )}
              {spot.twitter && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(spot.twitter)}
                >
                  <Icon name="logo-twitter" size={24} color="#1DA1F2" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ---------- MAP BUTTON ---------- */}
        <TouchableOpacity style={[styles.mapBtn, { backgroundColor: vibeTheme ? vibeTheme.primary : theme.primary }]} onPress={openMap}>
          <Icon name="map-outline" size={20} color={theme.text} />
          <Text style={[styles.mapBtnText, { color: theme.text }]}>View on Map</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: vibeTheme ? vibeTheme.primary : theme.primary }]} onPress={openMap}>
            <Icon name="navigate-outline" size={18} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: vibeTheme ? vibeTheme.primary : theme.primary }]}
            onPress={handleSaveToggle}
            disabled={saving}
          >
            <Icon
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isSaved ? "#ff9900" : theme.text}
            />
            <Text style={[styles.actionText, { color: isSaved ? "#ff9900" : theme.text }]}>
              {isSaved ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Visited Button */}
        <View style={[styles.section, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
          {isVisited ? (
            <View style={[styles.visitedBadge, { backgroundColor: topVibe ? topVibe.color : "#4CAF50" }]}>
              <Icon name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.visitedBadgeText}>You've visited this spot!</Text>
            </View>
          ) : countdownActive ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Stay within 1km for:</Text>
              <Text style={styles.countdownTime}>{formatTime(countdown)}</Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={stopCountdown}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.visitedButton, { backgroundColor: topVibe ? topVibe.color : "#4CAF50" }]}
              onPress={handleMarkAsVisited}
              disabled={checkingVisited}
            >
              <Icon name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.visitedButtonText}>
                {checkingVisited ? "Checking..." : "Mark as Visited"}
              </Text>
            </TouchableOpacity>
          )}
        </View>




        <View style={[styles.section, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
          <View style={styles.vibeHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>How people feel here</Text>

            <TouchableOpacity
              style={styles.addVibeBtn}
              onPress={() => setVibeModalVisible(true)}
            >
              <Icon name="add-circle-outline" size={18} color={theme.text} />
              <Text style={[styles.addVibeText, { color: theme.text }]}>Add vibe</Text>
            </TouchableOpacity>
          </View>

          {spotVibes.length === 0 ? (
            <View style={styles.emptyVibes}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No vibes yet ✨</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                Be the first to share how this place feels
              </Text>

              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: theme.primary }]}
                onPress={() => setVibeModalVisible(true)}
              >
                <Text style={[styles.emptyActionText, { color: theme.text }]}>Add a vibe</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vibeGrid}>
              {spotVibes.map((vibe) => {
                const iconName = vibe.icon;

                return (
                  <View key={vibe.id} style={[styles.vibeCard, { backgroundColor: vibe.color }]}>
                    <FontAwesome
                      name={iconName}
                      size={22}
                      color={"#fff"}
                    />
                    <Text style={[styles.vibeLabel, { color: "#fff" }]}>{vibe.name}</Text>
                    <Text style={[styles.vibeCount, { color: "#fff", fontWeight: "bold" }]}>{vibe.count}</Text>
                  </View>
                )
              }

              )}
            </View>
          )}
        </View>

        {/* ---------- COMMENTS SECTION ---------- */}
        <View style={[styles.section, { backgroundColor: vibeTheme ? vibeTheme.surface : theme.surface }]}>
          <View style={styles.commentHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Comments ({comments.length})</Text>
            <TouchableOpacity onPress={() => setShowComments(!showComments)}>
              <Icon
                name={showComments ? "chevron-up-outline" : "chevron-down-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {showComments && (
            <>
              {/* Add Comment Input */}
              {user && (
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={theme.text}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentSubmitBtn,
                      !commentText.trim() && styles.commentSubmitBtnDisabled
                    ]}
                    onPress={handleAddComment}
                    disabled={!commentText.trim()}
                  >
                    <Icon name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {loadingComments ? (
                <ActivityIndicator size="small" color="#ff9900" style={{ marginVertical: 20 }} />
              ) : comments.length === 0 ? (
                <View style={styles.emptyComments}>
                  <Text style={[styles.emptyCommentsText, { color: theme.text }]}>No comments yet. Be the first to comment!</Text>
                </View>
              ) : (
                <View style={[styles.commentsList, { backgroundColor: theme.surface }]}>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeaderRow}>
                        <View style={styles.commentUserInfo}>
                          {comment.user?.profileImage ? (
                            <Image
                              source={{ uri: comment.user.profileImage }}
                              style={styles.commentAvatar}
                            />
                          ) : (
                            <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                              <Text style={styles.commentAvatarText}>
                                {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                              </Text>
                            </View>
                          )}
                          <View>
                            <Text style={styles.commentUserName}>
                              {comment.user?.name || "Anonymous"}
                            </Text>
                            <Text style={styles.commentDate}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        {user?.id === comment.userId && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(comment.id)}
                            style={styles.commentDeleteBtn}
                          >
                            <Icon name="trash-outline" size={18} color="#ff4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>



      </ScrollView>

      <Modal
        visible={vibeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVibeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add your vibe</Text>
              <TouchableOpacity onPress={() => setVibeModalVisible(false)}>
                <Icon name="close" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View style={styles.vibeGrid}>
                {allVibes.map((vibe) => {
                  const active = selectedVibes.includes(vibe.id);
                  const isExistingVibe = myVibes && myVibes.includes(vibe.id);
                  const iconName = vibe.icon.replace(/^Fa/, '').toLowerCase();

                  const toggleVibe = () => {
                    if (active) {
                      setSelectedVibes(selectedVibes.filter((id) => id !== vibe.id));
                    } else if (selectedVibes.length < 3) {
                      setSelectedVibes([...selectedVibes, vibe.id]);
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={vibe.id}
                      style={[
                        styles.vibeCard,
                        active && { backgroundColor: vibe.color },
                        isExistingVibe && styles.existingVibeCard,
                        isExistingVibe && !active && styles.existingVibeCardUnselected,
                      ]}
                      onPress={toggleVibe}
                      activeOpacity={0.7}
                    >
                      <View style={styles.vibeCardContent}>
                        <FontAwesome
                          name={iconName}
                          size={22}
                          color={active ? "#fff" : vibe.color}
                        />
                        <Text style={[
                          styles.vibeLabel,
                          active && { color: "#fff" },
                          !active && { color: "#333" }
                        ]}>
                          {vibe.name}
                        </Text>
                        {isExistingVibe && active && (
                          <View style={styles.existingBadge}>
                            <Icon name="checkmark-circle" size={16} color="#fff" />
                            <Text style={styles.existingBadgeText}>Your vibe</Text>
                          </View>
                        )}
                        {isExistingVibe && !active && (
                          <View style={styles.existingBadgeUnselected}>
                            <Icon name="checkmark-circle" size={14} color="#FFD700" />
                            <Text style={styles.existingBadgeTextUnselected}>Previously added</Text>
                          </View>
                        )}
                      </View>
                      {isExistingVibe && (
                        <View style={[
                          styles.existingIndicator,
                          !active && styles.existingIndicatorUnselected
                        ]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: "#ff9900",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  updateVibes.mutate(selectedVibes);
                  setVibeModalVisible(false);
                }}
                disabled={selectedVibes.length === 0}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>
                  Continue ({selectedVibes.length}/3)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}




// -------------------------------------------------------------------------
//                                STYLES
// -------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  /* HEADER */
  header: {
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffffee",
    backdropFilter: "blur(6px)",
    zIndex: 50,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffffcc",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    maxWidth: "70%",
  },
  topVibe: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    // backgroundColor: "#fff3c4",
    paddingHorizontal: 15,
    paddingVertical: 2,
    borderRadius: 12,
  },

  topVibeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  headerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  headerRating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },


  /* HERO */
  hero: {
    height: 340,
  },

  heroImage: {
    width: "100%",
    height: 340,
  },

  heroOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  heroText: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },

  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },

  heroAddress: {
    color: "#eee",
    fontSize: 14,
  },

  /* THUMBNAILS */
  thumbRow: {
    paddingHorizontal: 10,
    marginTop: 10,
    flexDirection: "row",
  },
  thumb: {
    width: 80,
    height: 60,
    marginRight: 10,
    borderRadius: 10,
    overflow: "hidden",
    opacity: 0.8,
  },
  thumbActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#ffda32",
    transform: [{ scale: 1.04 }],
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  storyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -30,
    padding: 18,
    borderRadius: 20,
    elevation: 6,
  },

  storyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  storyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },

  readMore: {
    marginTop: 8,
    color: "#6C63FF",
    fontWeight: "600",
  },

  quickInfoContainer: {
    flexDirection: "column",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    elevation: 2,
  },
  quickInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },

  infoItem: {
    alignItems: "center",
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

  /* INFO */
  infoCard: {
    marginTop: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  location: { color: "#555" },
  ratingText: { color: "#555", fontSize: 14 },
  shortDesc: { marginTop: 10, color: "#444", lineHeight: 20 },
  longDesc: { marginTop: 6, color: "#555", lineHeight: 20 },
  toggleText: { color: "#007aff", fontWeight: "600", marginTop: 4 },

  /* SECTION BOX */
  section: {
    marginHorizontal: 12,
    backgroundColor: "#fff",
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  /* FEATURES */
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    // backgroundColor: "#fff8dd",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: { fontSize: 15, fontWeight: "600", color: "#444" },

  /* ITINERARY */
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  timelineDot: {
    width: 14,
    height: 14,
    backgroundColor: "#ffda32",
    borderRadius: 7,
    marginTop: 10,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    elevation: 1,
  },
  day: {
    fontWeight: "700",
    color: "#ff9900",
    marginBottom: 4,
  },
  dayTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  dayDetails: { color: "#555", lineHeight: 20 },

  /* REVIEWS */
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },

  vibeCard: {
    width: "30%",
    backgroundColor: "#f4f4f4",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },

  vibeCardActive: {
    backgroundColor: "#6C63FF",
  },

  existingVibeCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },

  existingVibeCardUnselected: {
    borderWidth: 2,
    borderColor: "#FFD700",
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },

  vibeCardContent: {
    alignItems: "center",
    gap: 6,
    width: "100%",
  },

  vibeLabel: {
    fontWeight: "600",
    fontSize: 13,
  },

  existingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    gap: 4,
  },

  existingBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
  },

  existingIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFD700",
    borderWidth: 2,
    borderColor: "#fff",
  },

  existingIndicatorUnselected: {
    backgroundColor: "#FFD700",
    borderColor: "#fff",
    opacity: 0.8,
  },

  existingBadgeUnselected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "#FFD700",
  },

  existingBadgeTextUnselected: {
    color: "#FFD700",
    fontSize: 9,
    fontWeight: "700",
  },

  vibeCount: {
    fontSize: 12,
    color: "#777",
  },

  hero: {
    width: "100%",
    height: 260,
    position: "relative",
  },

  heroImage: {
    width: "100%",
    height: 260,
    borderRadius: 12,
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    width: "100%",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },

  activeDot: {
    width: 10,
    height: 10,
    backgroundColor: "#fff",
  },

  likeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 10,
    borderRadius: 30,
    zIndex: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8, // spacing between chips
  },

  tagChip: {
    // backgroundColor: "#FFDA32", // bright yellow
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20, // rounded pill shape
    elevation: 2, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff", // dark text for contrast
  },


  /* MAP BUTTON */
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#ffda32",
    paddingVertical: 12,
    borderRadius: 12,
    color: "#fff"
  },
  mapBtnText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff"
  },

  /* ACTION BUTTONS */
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginHorizontal: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f3f3f3",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontWeight: "600",
  },
  vibeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  addVibeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  addVibeText: {
    fontWeight: "600",
  },

  emptyVibes: {
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  emptyAction: {
    marginTop: 12,
    backgroundColor: "#ffda32",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  emptyActionText: {
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // COMMENTS
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    gap: 8,
  },

  commentInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
  },

  commentSubmitBtn: {
    backgroundColor: "#ff9900",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  commentSubmitBtnDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },

  commentsList: {
    gap: 12,
  },

  commentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
  },

  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  commentUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  commentAvatarPlaceholder: {
    backgroundColor: "#ff9900",
    justifyContent: "center",
    alignItems: "center",
  },

  commentAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  commentUserName: {
    fontWeight: "700",
    fontSize: 14,
    color: "#333",
  },

  commentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  commentDeleteBtn: {
    padding: 4,
  },

  commentText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },

  emptyComments: {
    paddingVertical: 20,
    alignItems: "center",
  },

  emptyCommentsText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },

  visitedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  visitedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  visitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },

  visitedBadgeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  countdownContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  countdownLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },

  countdownTime: {
    fontSize: 36,
    fontWeight: "800",
    color: "#4CAF50",
    marginBottom: 12,
  },

  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },

  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

});
