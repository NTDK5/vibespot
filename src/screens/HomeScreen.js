import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllSpots, getSpotsByCategory, searchSpots, getNearbySpots } from '../services/spots.service';
import { LinearGradient } from "expo-linear-gradient";
import { useLocation } from "../hooks/useLocation";


const categories = [
  { id: "1", name: "Photoshot", icon: "camera" },
  { id: "2", name: "Sports", icon: "football" },
  { id: "3", name: "Art", icon: "color-palette" },
  { id: "4", name: "Workspace", icon: "briefcase" },
  { id: "5", name: "Movies", icon: "film" },
  { id: "6", name: "Hiking", icon: "walk" },
  { id: "7", name: "Night Life", icon: "moon" },
  { id: "8", name: "More", icon: "apps" },
];

export const HomeScreen = ({ navigation }) => {
  const [spots, setSpots] = useState([]);
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nearbySpots, setNearbySpots] = useState([]);
  useEffect(() => {
    if (location) {
      loadNearby();
    }
    loadSpots();
  }, [selectedCategory, location]);
  
  
  const loadNearby = async () => {
    setLoading(true);
    const result = await getNearbySpots(location.latitude, location.longitude, 5000);

    if (result.error) {
      setError(result.error);
    } else {
      setNearbySpots(result);
    }

    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const loadSpots = async () => {
    setLoading(true);
    try {
      const data = selectedCategory
        ? await getSpotsByCategory(selectedCategory)
        : await getAllSpots();
      setSpots(data);
    } catch (error) {
      console.error('Error loading spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSpotCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.spotCard}
      onPress={() => navigation.navigate("SpotDetail", { spotId: item.id })}
    >
      <Image
        source={{ uri: item.images?.[0] }}
        style={styles.spotImage}
        resizeMode="cover"
      />

      {/* Dark gradient for readability */}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)"]}
        style={styles.gradient}
      />

      {/* Floating Like Button */}
      <TouchableOpacity style={styles.likeButton}>
        <Ionicons name="heart-outline" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Category Pill */}
      <View style={styles.categoryPill}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
      

      {/* Content */}
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#ccc" />
          <Text numberOfLines={1} style={styles.address}>
            {item.address}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceBadge}>
            <Ionicons name="cash-outline" size={14} color="#fff" />
            <Text style={styles.price}>{item.priceRange}</Text>
          </View>
          <View style={styles.imageCount}>
            <Ionicons name="images-outline" size={14} color="#fff" />
            <Text style={styles.imageCountText}>{item.images.length}</Text>
          </View>
          <View style={styles.vibeRow}>
            <Ionicons name="sparkles-outline" size={14} color="#FFD54F" />
            <Text style={styles.vibeText}>Top vibe</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>

  );
  const renderNearbyCard = ({ item }) => (
    <TouchableOpacity
      style={styles.nearCard}
      onPress={() => navigation.navigate("SpotDetail", { spotId: item.id })}
    >
            <Image
        source={{ uri: item.images[0] || '' }}
        style={styles.nearImage} 
        resizeMode="cover"
      />
  
      <View style={styles.nearInfo}>
        <View style={styles.nearTop}>
          <Text style={styles.nearTitle}>{item.title}</Text>
          <Text style={styles.nearCategory}>{item.category}</Text>
        </View>


        <View style={styles.nearBadges}>
        <View style={styles.distancePill}>
          <Ionicons name="navigate-outline" size={12} color="#fff" />
          <Text style={styles.distanceText}>{item.distance || "2.3 km"}</Text>
        </View>

        <Text style={styles.priceRange}>{item.priceRange}</Text>

        {/* Rating */}
        <View style={styles.nearRatingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.nearRating}>{item.rating}</Text>
        </View>

      </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
      <FlatList
        data={nearbySpots}
        renderItem={renderNearbyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greetingSmall}>Welcome back</Text>
                <Text style={styles.greeting}>Nate 👋</Text>
              </View>

              <TouchableOpacity style={styles.notificationBtn}>
                <Ionicons name="notifications-outline" size={24} color="#111" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>

    
            {/* SEARCH */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search cafes, vibes, activities…"
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
    
            {/* CATEGORIES */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryPillBig}>
                  <Ionicons name={cat.icon} size={20} color="#111" />
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

    
            {/* FEATURED */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Editor’s Picks</Text>
              <Text style={styles.seeAll}>See All</Text>
            </View>
    
            <FlatList
              data={spots}
              horizontal
              renderItem={renderSpotCard}
              keyExtractor={(spot) => spot.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
    
            {/* SPOTS NEARBY TITLE */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Near You Now</Text>
              <TouchableOpacity style={styles.nearFilterBtn}>
                <Ionicons name="options-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </>
        }
      />
  );
};

const styles = StyleSheet.create({
  container:  {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  
  },
  greetingSmall: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },
  
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4D4F",
  },
  
  imageCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  
  imageCountText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  
  // SEARCH
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  
  categoryPillBig: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  categoryLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  
  // SECTION TITLES
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical : 10
  },
  sectionTitle: { fontSize: 20, fontWeight: "700"  },
  seeAll: { fontSize: 14, color: "#6C63FF", fontWeight: "600" },

  // FEATURED CARD
  spotCard: {
    width: 250,
    height: 300,
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#111",
  
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  
    // Android
    elevation: 8,
  },
  
  spotImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  
  gradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  
  /* Floating like */
  likeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 8,
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  
  /* Category pill */
  categoryPill: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(255, 255, 255, 0.69)",
    textAlign: "center",
    paddingHorizontal: 8,
    paddingBottom: 3,
    borderRadius: 14,
  },
  
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  
  /* Content */
  content: {
    position: "absolute",
    bottom: 0,
    padding: 16,
    width: "100%",
  },
  
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  
  address: {
    color: "#ddd",
    fontSize: 13,
    marginLeft: 4,
    flexShrink: 1,
  },
  
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  priceBadge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  
  price: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
  },
  
  vibeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  
  vibeText: {
    color: "#FFD54F",
    fontSize: 12,
    fontWeight: "600",
  },
  

  // CATEGORIES
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  categoryItem: {
    width: "25%",
    alignItems: "center",
    marginVertical: 14,
  },
  categoryText: {
    marginTop: 6,
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },
 // NEARBY CARD - SIDE BY SIDE
nearCard: {
  width: "100%",
  backgroundColor: "#fff",
  borderRadius: 18,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  overflow: "hidden",
  flexDirection: "row",        // SIDE BY SIDE
},
nearBadges: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 8,
},

distancePill: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#6C63FF",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 10,
},

distanceText: {
  color: "#fff",
  fontSize: 12,
},

priceRange: {
  fontSize: 12,
  fontWeight: "600",
  color: "#555",
},

nearImage: {
  width: 160,                  // FIXED IMAGE WIDTH
  height: "100%",              // FULL HEIGHT OF CARD
  borderTopLeftRadius: 18,
  borderBottomLeftRadius: 18,
},

nearInfo: {
  flex: 1,
  padding: 16,
  justifyContent: "center",
},

nearTop: {
  marginBottom: 6,
},

nearTitle: {
  fontSize: 17,
  fontWeight: "700",
  color: "#333",
},

nearCategory: {
  fontSize: 13,
  color: "#777",
  marginTop: 2,
},

nearMetaRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
},

nearMetaText: {
  marginLeft: 4,
  fontSize: 13,
  color: "#555",
  fontWeight: "500",
},


});
