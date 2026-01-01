import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllSpots, getSpotsByCategory, searchSpots, getNearbySpots } from '../services/spots.service';
import { getWeeklySpotRanks } from '../services/weeklyRank.service';
import { LinearGradient } from "expo-linear-gradient";
import { useLocation } from "../hooks/useLocation";
import { useAuth } from "../hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import {SpotCard} from "../components/SpotCard";
import { NearbySpotCard } from "../components/NearbySpotCard";
import { RankSpotCard } from "../components/RankSpotCard";


const { width } = Dimensions.get("window");

const categories = [
  { id: "1", name: "Photo Spots", icon: "camera", color: "#FF6B6B" },
  { id: "2", name: "Sports", icon: "football", color: "#4ECDC4" },
  { id: "3", name: "Art", icon: "color-palette", color: "#FFE66D" },
  { id: "4", name: "Workspace", icon: "briefcase", color: "#95E1D3" },
  { id: "5", name: "Entertainment", icon: "film", color: "#F38181" },
  { id: "6", name: "Nature", icon: "leaf", color: "#AAE3E2" },
  { id: "7", name: "Nightlife", icon: "moon", color: "#6C5CE7" },
  { id: "8", name: "Restaurant", icon: "restaurant", color: "#FF7675" },
];

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const { location, loading: locationLoading } = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [weeklyRanks, setWeeklyRanks] = useState([]);
  const [loadingRanks, setLoadingRanks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [stats, setStats] = useState({
    totalSpots: 0,
    nearbyCount: 0,
    topRated: 0,
  });

  useEffect(() => {
    if (location) {
      loadNearby();
    }
    loadSpots();
    loadWeeklyRanks();
    loadStats();
  }, [selectedCategory, location]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadStats = () => {
    setStats({
      totalSpots: spots.length,
      nearbyCount: nearbySpots.length,
      topRated: spots.filter(s => s.ratingAvg >= 4).length,
    });
  };

  const loadNearby = async () => {
    if (!location) return;
    try {
      const result = await getNearbySpots(location.latitude, location.longitude, 5000);
      if (!result.error) {
        setNearbySpots(result);
      }
    } catch (error) {
      console.error('Error loading nearby spots:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadSpots(),
      loadWeeklyRanks(),
      location && loadNearby(),
    ]);
    setRefreshing(false);
  };

  const loadSpots = async () => {
    try {
      const data = selectedCategory
        ? await getSpotsByCategory(selectedCategory)
        : await getAllSpots();
      setSpots(data || []);
      loadStats();
    } catch (error) {
      console.error('Error loading spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyRanks = async () => {
    setLoadingRanks(true);
    try {
      const result = await getWeeklySpotRanks();
      if (!result.error && result.spots) {
        setWeeklyRanks(result.spots);
      }
    } catch (error) {
      console.error('Error loading weekly ranks:', error);
    } finally {
      setLoadingRanks(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      const results = await searchSpots({ q: query });
      if (!results.error) {
        setSearchResults(results.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const renderSpotCard = ({ item, index }) => (
    <SpotCard spot={item} onPress={() => navigation.navigate("SpotDetail", { spotId: item.id })} />
  );

  const renderNearbyCard = ({ item, index }) => (
    <NearbySpotCard spot={item} onPress={() => navigation.navigate("SpotDetail", { spotId: item.id })} />
  );

  const renderRankCard = ({rankedSpot, index}) => {
    return <RankSpotCard spot={rankedSpot} navigation={navigation} key={index}/>
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="location" size={24} color="#6C5CE7" />
        <Text style={styles.statNumber}>{stats.nearbyCount}</Text>
        <Text style={styles.statLabel}>Nearby</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="star" size={24} color="#FFD700" />
        <Text style={styles.statNumber}>{stats.topRated}</Text>
        <Text style={styles.statLabel}>Top Rated</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="map" size={24} color="#FF6B6B" />
        <Text style={styles.statNumber}>{stats.totalSpots}</Text>
        <Text style={styles.statLabel}>Total Spots</Text>
      </View>
    </View>
  );

  if (loading && spots.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Discovering amazing spots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* HEADER */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingSmall}>
                {new Date().getHours() < 12 ? 'Good Morning' : 
                 new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
              </Text>
              <Text style={styles.greeting}>
                {user?.name || 'Explorer'} 👋
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="#333" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("Profile")}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={18} color="#6C5CE7" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* SEARCH */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>Search spots, vibes, activities...</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>

        {/* STATS */}
        {renderStatsCard()}

        {/* CATEGORIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && styles.categoryCardActive,
                  { borderLeftColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon} size={24} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* WEEKLY RANKS */}
        {weeklyRanks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.trophyIcon}
                >
                  <Ionicons name="trophy" size={20} color="#fff" />
                </LinearGradient>
                <View>
                  <Text style={styles.sectionTitle}>Weekly Champions</Text>
                  <Text style={styles.sectionSubtitle}>Top trending spots this week</Text>
                </View>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ranksRow}
              pagingEnabled
            >
              {weeklyRanks.map((rankedSpot, index) => renderRankCard({rankedSpot, index}))}
            </ScrollView>
          </View>
        )}

        {/* FEATURED */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Spots</Text>
              <Text style={styles.sectionSubtitle}>Handpicked for you</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={spots.slice(0, 10)}
            horizontal
            renderItem={renderSpotCard}
            keyExtractor={(spot) => spot.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsRow}
            snapToInterval={width * 0.8 + 16}
            decelerationRate="fast"
          />
        </View>

        {/* NEARBY */}
        {nearbySpots.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Near You</Text>
                <Text style={styles.sectionSubtitle}>
                  {nearbySpots.length} spots within 5km
                </Text>
              </View>
              <TouchableOpacity style={styles.nearFilterBtn}>
                <Ionicons name="options-outline" size={20} color="#6C5CE7" />
              </TouchableOpacity>
            </View>
            <View style={styles.nearbyList}>
              {nearbySpots.slice(0, 5).map((item, index) => (
                <View key={item.id}>{renderNearbyCard({ item, index })}</View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#F8F9FA",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greetingSmall: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6C5CE720",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4D4F",
  },
  searchContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#999",
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  seeAll: {
    fontSize: 15,
    color: "#6C5CE7",
    fontWeight: "700",
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: 100,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardActive: {
    backgroundColor: "#6C5CE710",
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  ranksRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  rankCard: {
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  rankGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  rankBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    gap: 6,
  },
  rankNumber: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "800",
  },
  rankImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  rankContent: {
    position: "absolute",
    bottom: 0,
    padding: 20,
    width: "100%",
    zIndex: 5,
  },
  rankTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  rankMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankVibes: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  rankVibeText: {
    color: "#FFD54F",
    fontSize: 13,
    fontWeight: "700",
  },
  rankScore: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  rankScoreText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  spotsRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  spotCard: {
    width: width * 0.8,
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
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
  likeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 22,
    zIndex: 10,
  },
  categoryPill: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  categoryText: {
    color: "#1A1A1A",
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    position: "absolute",
    bottom: 0,
    padding: 20,
    width: "100%",
    zIndex: 5,
  },
  
  nearbyList: {
    paddingHorizontal: 20,
    gap: 4,
  },
  nearCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nearImage: {
    width: 140,
    height: 120,
  },
  nearInfo: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  nearTop: {
    marginBottom: 8,
  },
  nearTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  nearCategory: {
    fontSize: 13,
    color: "#666",
    textTransform: "capitalize",
  },
  nearBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  priceBadgeSmall: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceRange: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  nearRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nearRating: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
});
