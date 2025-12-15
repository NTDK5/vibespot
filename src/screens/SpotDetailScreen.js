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

export default function SpotDetailsScreen({ route, navigation }) {
  const { spotId } = route.params;

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
              <Image
                source={{ uri: item }}
                style={styles.heroImage}
              />
            )}
            sliderWidth={width}
            itemWidth={width}
            onSnapToItem={(index) => setActiveIndex(index)}
            autoplay
            loop
          />

          {/* Like Button */}
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => setLiked(!liked)}
          >
            <Icon
              name={liked ? "heart" : "heart-outline"}
              size={28}
              color={liked ? "#ff5a5f" : "#fff"}
            />
          </TouchableOpacity>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {(spot.images || []).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeIndex === i && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ---------- DETAILS ---------- */}
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
        </View>
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
        <View style={styles.section}>
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
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 260,
    borderRadius: 14,
  },
  likeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 10,
    borderRadius: 30,
  },
  reviewRating: {
    flexDirection:"row",
    gap: 5
    ,
    alignItems: "center"
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
  reviewCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: "#ffeccc",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewName: { fontWeight: "700" },
  reviewDate: { color: "#999", fontSize: 12 },
  reviewBody: { marginTop: 6, color: "#444" },

  addReviewBtn: {
    marginTop: 8,
    backgroundColor: "#ffda32",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
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
