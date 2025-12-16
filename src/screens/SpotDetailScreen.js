import React, { useState, useEffect } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { getSpotById } from '../services/spots';
import { Platform } from "react-native";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");
const SAMPLE_VIBES = [
  { id: "chill", icon: "leaf-outline", label: "Chill", count: 124 },
  { id: "productive", icon: "laptop-outline", label: "Productive", count: 89 },
  { id: "romantic", icon: "heart-outline", label: "Romantic", count: 42 },
  { id: "creative", icon: "color-palette-outline", label: "Creative", count: 67 },
  { id: "social", icon: "people-outline", label: "Social", count: 58 },
];

export default function SpotDetailsScreen({ route, navigation }) {
  const { spotId } = route.params;
  const [vibes, setVibes] = useState(SAMPLE_VIBES);
  const [selectedVibe, setSelectedVibe] = useState(null);  
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showMore, setShowMore] = useState(false);

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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
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

  return (
    <SafeAreaView style={styles.container}>
      {/* ---------- TOP HEADER ---------- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {spot.title}
          </Text>
          <View style={styles.headerRatingRow}>
            <Text style={styles.headerRating}>{spot.rating ? spot.rating : '4.5'}</Text>
            <Icon name="star" size={16} color="#f5b84d" />
          </View>
        </View>

        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-social-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 90 }}>
        {/* ---------- HERO / CAROUSEL ---------- */}
        <View style={styles.hero}>
          <Carousel
            data={spot.images || []}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.heroImage} />
            )}
            sliderWidth={width}
            itemWidth={width}
            onSnapToItem={setActiveIndex}
            loop
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

        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>The Vibe</Text>

          <Text style={styles.storyText} numberOfLines={showMore ? 20 : 4}>
            {spot.description}
          </Text>

          <TouchableOpacity onPress={() => setShowMore(!showMore)}>
            <Text style={styles.readMore}>
              {showMore ? "Show less" : "Read the story"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------- DETAILS ----------
        <View style={styles.infoCard}>
          <Text style={styles.title}>{spot.title}</Text>

          <View style={styles.row}>
            <Icon name="location" size={16} color="#777" />
            <Text style={styles.location}>{spot.address}</Text>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Icon name="star" size={18} color="#f5b84d" />
            <Text style={styles.ratingText}>
              {spot.rating} ({spot.totalReviews ? spot.totalReviews: "10" }  reviews)
            </Text>
          </View>

          <Text style={styles.shortDesc}>{spot.description}</Text>

          <Text style={styles.longDesc} numberOfLines={showMore ? 50 : 3}>
            {spot.longDescription}
          </Text>

          <TouchableOpacity
            onPress={() => setShowMore(!showMore)}
          >
            <Text style={styles.toggleText}>
              {showMore ? "Show Less" : "Read More"}
            </Text>
          </TouchableOpacity>
        </View> */}
            {/* ---------- TAGS ---------- */}
        {spot.tags && spot.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {spot.tags.map((tag, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}


        

        {/* ---------- FEATURES ---------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          {(spot.features || []).map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon name="checkmark" size={18} color="#ff9900" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

                {/* ---------- MAP BUTTON ---------- */}
        <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
          <Icon name="map-outline" size={20} color="#000" />
          <Text style={styles.mapBtnText}>View on Map</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={openMap}>
          <Icon name="navigate-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="bookmark-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
      </View>
        {/* ---------- REVIEWS ---------- */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>

          {(spot.reviews || []).map((review, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={{ fontWeight: "700", color: "#b85a00" }}>
                      {review.user[0]}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.reviewName}>{review.user}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>

                <View style={styles.reviewRating}>
                  <Text>{review.rating}</Text>
                  <Icon name="star" size={14} color="#f5b84d" />
                </View>
              </View>

              <Text style={styles.reviewBody}>{review.comment}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.addReviewBtn}>
            <Text style={{ color: "#000", fontWeight: "700" }}>Add Review</Text>
          </TouchableOpacity>
        </View> */}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How people feel here</Text>

              <View style={styles.vibeGrid}>
                {vibes.map((vibe) => {
                  const active = selectedVibe === vibe.id;

                  return (
                    <TouchableOpacity
                      key={vibe.id}
                      style={[
                        styles.vibeCard,
                        active && styles.vibeCardActive,
                      ]}
                      onPress={() => {
                        setSelectedVibe(vibe.id);
                        setVibes((prev) =>
                          prev.map((v) =>
                            v.id === vibe.id
                              ? { ...v, count: v.count + 1 }
                              : v
                          )
                        );
                      }}
                    >
                      <Icon
                        name={vibe.icon}
                        size={26}
                        color={active ? "#fff" : "#333"}
                      />
                      <Text style={[styles.vibeLabel, active && { color: "#fff" }]}>
                        {vibe.label}
                      </Text>
                      <Text style={[styles.vibeCount, active && { color: "#fff" }]}>
                        {vibe.count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

      </ScrollView>
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
      paddingBottom:20,
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
    backgroundColor: "#fff8dd",
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
  },
  
  vibeCardActive: {
    backgroundColor: "#6C63FF",
  },
  
  vibeLabel: {
    fontWeight: "600",
    fontSize: 13,
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
  /* TAGS */
tagsContainer: {
  padding: 16,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
},
tagChip: {
  backgroundColor: "#fff3c4",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
},
tagText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#8a5a00",
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
},
mapBtnText: {
  fontWeight: "700",
  fontSize: 15,
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
  
});
