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
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllSpots, searchSpots, getNearbySpots, getSurpriseMeSpot } from '../services/spots.service';
import { getWeeklySpotRanks } from '../services/weeklyRank.service';
import { LinearGradient } from "expo-linear-gradient";
import { useLocation } from "../hooks/useLocation";
import { useAuth } from "../hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import {SpotCard} from "../components/SpotCard";
import { NearbySpotCard } from "../components/NearbySpotCard";
import { RankSpotCard } from "../components/RankSpotCard";
import { CATEGORIES } from "../utils/constants";


const { width } = Dimensions.get("window");

// Map categories with colors for display
const categories = CATEGORIES.map((cat, index) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AAE3E2", "#6C5CE7", "#FF7675"];
  return {
    id: cat.id,
    name: cat.label,
    icon: cat.icon || "ellipse",
    color: colors[index % colors.length],
  };
});

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
  const [searchCategory, setSearchCategory] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [stats, setStats] = useState({
    visitedSpots: 0,
    nearbyCount: 0,
    savedSpots: 0,
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
      handleSearch(searchQuery, searchCategory);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchCategory]);

  const loadStats = () => {
    setStats({
      visitedSpots: spots.length,
      nearbyCount: nearbySpots.length,
      savedSpots: 7,
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
        ? await searchSpots({ category: selectedCategory })
        : await getAllSpots();
      setSpots(data?.data || data || []);
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

  const handleSearch = async (query, category = null) => {
    setIsSearching(true);
    try {
      const results = await searchSpots({ 
        q: query,
        category: category || undefined,
      });
      if (!results.error) {
        setSearchResults(results.data || results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
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
        <Text style={styles.statNumber}>{stats.visitedSpots}</Text>
        <Text style={styles.statLabel}>Visited</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="map" size={24} color="#FF6B6B" />
        <Text style={styles.statNumber}>{stats.savedSpots}</Text>
        <Text style={styles.statLabel}>Saved</Text>
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
              <TouchableOpacity
                style={styles.surpriseMeButton}
                onPress={async () => {
                  try {
                    const spot = await getSurpriseMeSpot();
                    if (!spot.error && spot.id) {
                      navigation.navigate("SpotDetail", { spotId: spot.id });
                    } else {
                      Alert.alert("Error", spot.error || "Failed to get surprise spot");
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to get surprise spot");
                  }
                }}
              >
                <Ionicons name="sparkles" size={18} color="#fff" />
              </TouchableOpacity>
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
            <Text style={styles.searchPlaceholder}>
              {searchQuery || "Search spots, vibes, activities..."}
            </Text>
            <TouchableOpacity 
              style={styles.filterBtn}
              onPress={() => setShowSearch(true)}
            >
              <Ionicons name="options" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>

        {/* STATS */}
        {renderStatsCard()}

        {/* CATEGORIES */}
       {/* CATEGORIES */}
          <View style={styles.section}>
            {/* Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Explore</Text>
                <Text style={styles.sectionSubtitle}>Find spots by vibe</Text>
              </View>
            </View>

            {/* Horizontal Rail */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.85}
                    onPress={() =>
                      setSelectedCategory(isActive ? null : cat.id)
                    }
                    style={[
                      styles.categoryCard,
                      isActive && {
                        backgroundColor: cat.color,
                        shadowColor: cat.color,
                      },
                    ]}
                  >
                    {/* Icon */}
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.25)"
                            : cat.color + "22",
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={26}
                        color={isActive ? "#fff" : cat.color}
                      />
                    </View>

                    {/* Label */}
                    <Text
                      style={[
                        styles.categoryLabel,
                        isActive && { color: "#fff" },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>

                    {/* Active Indicator */}
                    {isActive && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
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
            data={spots?.slice(0, 10)}
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

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowSearch(false);
          setSearchQuery("");
          setSearchResults([]);
          setSearchCategory(null);
        }}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
                setSearchCategory(null);
              }}
              style={styles.searchBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search spots, vibes, activities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                style={styles.searchClearButton}
              >
                <Ionicons name="close-circle" size={24} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter */}
          <View style={styles.searchCategoryContainer}>
            <Text style={styles.searchCategoryTitle}>Filter by Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.searchCategoriesRow}
            >
              <TouchableOpacity
                style={[
                  styles.searchCategoryChip,
                  !searchCategory && styles.searchCategoryChipActive,
                ]}
                onPress={() => setSearchCategory(null)}
              >
                <Text
                  style={[
                    styles.searchCategoryChipText,
                    !searchCategory && styles.searchCategoryChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.searchCategoryChip,
                    searchCategory === cat.id && styles.searchCategoryChipActive,
                  ]}
                  onPress={() => setSearchCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.searchCategoryChipText,
                      searchCategory === cat.id && styles.searchCategoryChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Search Results */}
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#6C5CE7" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : searchQuery.length > 2 && searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => {
                      setShowSearch(false);
                      navigation.navigate("SpotDetail", { spotId: item.id });
                    }}
                  >
                    <Image
                      source={{ uri: item.thumbnail || item.images?.[0] }}
                      style={styles.searchResultImage}
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultTitle}>{item.title}</Text>
                      <Text style={styles.searchResultCategory}>
                        {item.category?.replace("_", " ")}
                      </Text>
                      <View style={styles.searchResultMeta}>
                        <View style={styles.searchResultRating}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.searchResultRatingText}>
                            {item.ratingAvg?.toFixed(1) || "0.0"}
                          </Text>
                        </View>
                        <Text style={styles.searchResultPrice}>
                          {item.priceRange?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.searchResultsList}
              />
            ) : searchQuery.length > 2 && !isSearching ? (
              <View style={styles.searchEmptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.searchEmptyText}>No results found</Text>
                <Text style={styles.searchEmptySubtext}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              <View style={styles.searchEmptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.searchEmptyText}>Start typing to search</Text>
                <Text style={styles.searchEmptySubtext}>
                  Search for spots, categories, or activities
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  surpriseMeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6C5CE7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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

  
  categoriesRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 14,
  },
  
  categoryCard: {
    width: 110,
    height: 130,
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  
    // shadowOffset: { width: 0, height: 10 },
    // shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  
  categoryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginTop: 6,
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
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBackButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  searchClearButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchCategoryContainer: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchCategoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchCategoriesRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  searchCategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  searchCategoryChipActive: {
    backgroundColor: "#6C5CE7",
  },
  searchCategoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  searchCategoryChipTextActive: {
    color: "#fff",
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  searchResultsList: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultImage: {
    width: 100,
    height: 100,
  },
  searchResultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  searchResultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchResultRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchResultRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  searchResultPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  searchEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  searchEmptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
});
