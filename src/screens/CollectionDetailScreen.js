/**
 * Collection Detail Screen - Immersive Journey
 * Parallax hero, glass info bar, editorial spot cards
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  getCollectionById,
  likeCollection,
  deleteCollection,
} from "../services/collections.service";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { useSpotVibes } from "../hooks/useSpotVibes";
import { spacing, radius, shadows } from "../theme/tokens";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 280;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const THUMB_SIZE = 56;
const THUMB_GAP = 8;

const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== "string") return `rgba(0,0,0,${alpha})`;
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const SpotCardEditorial = ({ spot, onPress }) => {
  const { theme } = useTheme();
  const { data: spotVibes = [] } = useSpotVibes(spot?.id);
  const topVibe =
    spotVibes.length > 0
      ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
      : null;
  const accentColor = topVibe?.color || theme.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.spotCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View style={styles.spotImageWrap}>
        <Image
          source={{ uri: spot?.images?.[0] || spot?.thumbnail }}
          style={styles.spotImage}
        />
        <LinearGradient
          colors={["transparent", hexToRgba(accentColor, 0.7)]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.spotCategoryPill, { backgroundColor: hexToRgba(accentColor, 0.9) }]}>
          <Text style={styles.spotCategoryText}>
            {spot?.category?.replace("_", " ").toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={[styles.spotInfo, { borderTopColor: theme.border }]}>
        <Text style={[styles.spotTitle, { color: theme.text }]} numberOfLines={1}>
          {spot?.title}
        </Text>
        {spot?.address && (
          <View style={styles.spotAddressRow}>
            <Ionicons name="location-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.spotAddress, { color: theme.textMuted }]} numberOfLines={1}>
              {spot.address}
            </Text>
          </View>
        )}
        <View style={styles.spotFooter}>
          {spot?.priceRange && (
            <Text style={[styles.spotPrice, { color: theme.textMuted }]}>
              {spot.priceRange}
            </Text>
          )}
          {spot?.ratingAvg > 0 && (
            <View style={styles.spotRating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.spotRatingText}>{spot.ratingAvg.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const CollectionDetailScreen = ({ route, navigation }) => {
  const { collectionId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const data = await getCollectionById(collectionId);
      if (!data?.error) setCollection(data);
      else throw new Error(data.error);
    } catch (e) {
      Alert.alert("Error", "Unable to load collection");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollection();
    setRefreshing(false);
  };

  const handleLike = async () => {
    const res = await likeCollection(collectionId);
    if (!res?.error) {
      setCollection((prev) => ({
        ...prev,
        isLiked: res.liked,
        likeCount: res.likeCount,
      }));
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Collection", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await deleteCollection(collectionId);
          if (!res?.error) navigation.goBack();
          else Alert.alert("Error", res.error);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.loadingWrap, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!collection) return null;

  const spots = collection.spots || [];
  const coverImage =
    collection.coverImage ||
    spots[0]?.spot?.images?.[0] ||
    spots[0]?.spot?.thumbnail;
  const isOwner = user?.id === collection.userId;

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.5],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const stickyOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AnimatedFlatList
        data={spots}
        keyExtractor={(item) => item.spot.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              {coverImage ? (
                <Animated.Image
                  source={{ uri: coverImage }}
                  style={[styles.heroImage, { opacity: heroOpacity }]}
                />
              ) : (
                <View
                  style={[
                    styles.heroPlaceholder,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <Ionicons
                    name="images-outline"
                    size={64}
                    color={theme.textMuted}
                  />
                </View>
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={styles.heroGradient}
              />

              {/* Hero actions */}
              <SafeAreaView style={styles.heroActions} edges={["top"]}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity
                    style={[styles.iconBtn, styles.iconBtnDanger]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </SafeAreaView>
            </View>

            {/* Glass info bar */}
            <View style={[styles.glassBar, { backgroundColor: theme.surface }]}>
              <Text style={[styles.title, { color: theme.text }]}>
                {collection.title}
              </Text>
              {collection.description ? (
                <Text
                  style={[styles.description, { color: theme.textMuted }]}
                  numberOfLines={2}
                >
                  {collection.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <View style={styles.authorRow}>
                  {collection.user?.profileImage ? (
                    <Image
                      source={{ uri: collection.user.profileImage }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        { backgroundColor: theme.primarySoft },
                      ]}
                    >
                      <Ionicons name="person" size={14} color={theme.primary} />
                    </View>
                  )}
                  <Text style={[styles.authorName, { color: theme.textMuted }]}>
                    {collection.user?.name || "Unknown"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.likePill,
                    {
                      backgroundColor: collection.isLiked
                        ? theme.error + "15"
                        : theme.surfaceAlt,
                    },
                  ]}
                  onPress={handleLike}
                >
                  <Ionicons
                    name={collection.isLiked ? "heart" : "heart-outline"}
                    size={18}
                    color={collection.isLiked ? "#FF4D6D" : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.likeText,
                      {
                        color: collection.isLiked ? "#FF4D6D" : theme.text,
                      },
                    ]}
                  >
                    {collection.likeCount || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Thumbnail strip */}
            {spots.length > 0 && (
              <View style={styles.thumbStrip}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  SPOTS ({spots.length})
                </Text>
                <FlatList
                  data={spots}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbList}
                  keyExtractor={(item) => item.spot.id}
                  ItemSeparatorComponent={() => <View style={{ width: THUMB_GAP }} />}
                  renderItem={({ item }) => (
                    <Image
                      source={{
                        uri:
                          item.spot?.images?.[0] || item.spot?.thumbnail,
                      }}
                      style={[
                        styles.thumb,
                        { borderColor: theme.border },
                      ]}
                    />
                  )}
                />
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              The journey
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <SpotCardEditorial
            spot={item.spot}
            onPress={() =>
              navigation.navigate("SpotDetail", { spotId: item.spot.id })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="images-outline"
              size={56}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No spots in this collection yet
            </Text>
          </View>
        }
      />

      {/* Sticky header on scroll */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            opacity: stickyOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <SafeAreaView edges={["top"]}>
          <Text
            style={[styles.stickyTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {collection.title}
          </Text>
        </SafeAreaView>
      </Animated.View>

      {/* Back button overlay when sticky visible */}
      <Animated.View
        style={[styles.stickyBackWrap, { opacity: stickyOpacity }]}
        pointerEvents="box-none"
      >
        <SafeAreaView edges={["top"]} style={styles.stickyBackSafe}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: { paddingBottom: spacing.xxl * 2 },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: "#111",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroActions: {
    position: "absolute",
    top: 0,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnDanger: {
    backgroundColor: "rgba(255,77,79,0.6)",
  },

  glassBar: {
    marginTop: -48,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  description: {
    fontSize: 15,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  authorName: { fontSize: 14, fontWeight: "600" },
  likePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: 6,
  },
  likeText: { fontSize: 15, fontWeight: "700" },

  thumbStrip: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  thumbList: {
    paddingHorizontal: spacing.md,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.sm,
    borderWidth: 2,
  },
  sectionTitle: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 20,
    fontWeight: "800",
  },

  spotCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  spotImageWrap: {
    height: 180,
  },
  spotImage: {
    width: "100%",
    height: "100%",
  },
  spotCategoryPill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  spotCategoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  spotInfo: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  spotTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  spotAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  spotAddress: { fontSize: 13, flex: 1 },
  spotFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  spotPrice: { fontSize: 13, fontWeight: "600" },
  spotRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotRatingText: {
    color: "#FFD700",
    fontWeight: "700",
    fontSize: 13,
  },

  empty: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  stickyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  stickyBackWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  stickyBackSafe: {
    padding: spacing.md,
  },
});
