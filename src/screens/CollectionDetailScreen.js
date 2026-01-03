import React, { useState, useEffect } from "react";
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
import { SpotCard } from "../components/SpotCard";
import { NearbySpotCard } from "../components/NearbySpotCard";

const { width } = Dimensions.get("window");

export const CollectionDetailScreen = ({ route, navigation }) => {
  const { collectionId } = route.params;
  const { user } = useAuth();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    Alert.alert(
      "Delete Collection",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteCollection(collectionId);
            if (!res?.error) navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </SafeAreaView>
    );
  }

  if (!collection) return null;

  const coverImage =
    collection.coverImage ||
    collection.spots?.[0]?.spot?.thumbnail ||
    collection.spots?.[0]?.spot?.images?.[0];

  const isOwner = user?.id === collection.userId;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={collection.spots || []}
        keyExtractor={(item) => item.spot.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Cover */}
            <View style={styles.cover}>
              {coverImage && (
                <Image source={{ uri: coverImage }} style={styles.coverImage} />
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.gradient}
              />

              {/* Header actions */}
              <View style={styles.headerActions}>
                <IconButton icon="arrow-back" onPress={navigation.goBack} />
                {isOwner && (
                  <IconButton icon="trash-outline" danger onPress={handleDelete} />
                )}
              </View>
            </View>

            {/* Floating Card */}
            <View style={styles.infoCard}>
              <Text style={styles.title}>{collection.title}</Text>

              {!!collection.description && (
                <Text style={styles.description}>
                  {collection.description}
                </Text>
              )}

              <View style={styles.metaRow}>
                <View style={styles.author}>
                  {collection.user?.profileImage ? (
                    <Image
                      source={{ uri: collection.user.profileImage }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Ionicons name="person" size={14} color="#555" />
                    </View>
                  )}
                  <Text style={styles.authorName}>
                    {collection.user?.name || "Unknown"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.likePill}
                  onPress={handleLike}
                >
                  <Ionicons
                    name={collection.isLiked ? "heart" : "heart-outline"}
                    size={18}
                    color={collection.isLiked ? "#FF4D4F" : "#444"}
                  />
                  <Text style={styles.likeText}>
                    {collection.likeCount || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Spots</Text>
          </>
        }
        renderItem={({ item }) => (
          <NearbySpotCard
            spot={item.spot}
            onPress={() =>
              navigation.navigate("SpotDetail", { spotId: item.spot.id })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={56} color="#bbb" />
            <Text style={styles.emptyText}>No spots yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

/* ---------------------------------- */
/* Small UI Components */
/* ---------------------------------- */

const IconButton = ({ icon, onPress, danger }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.iconButton,
      danger && { backgroundColor: "rgba(255,77,79,0.25)" },
    ]}
  >
    <Ionicons name={icon} size={22} color="#fff" />
  </TouchableOpacity>
);

const Stat = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------------------------------- */
/* Styles */
/* ---------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cover: {
    height: 320,
    backgroundColor: "#111",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    inset: 0,
  },

  headerActions: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  infoCard: {
    marginTop: -48,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },
  description: {
    fontSize: 15,
    color: "#555",
    marginTop: 8,
    lineHeight: 22,
  },

  metaRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
  },

  likePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F2F6",
  },
  likeText: {
    marginLeft: 6,
    fontWeight: "700",
  },

  stats: {
    marginTop: 16,
    flexDirection: "row",
  },
  statBox: {
    marginRight: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 16,
    fontSize: 20,
    fontWeight: "800",
  },

  list: {
    paddingBottom: 40,
  },

  empty: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#777",
    fontWeight: "600",
  },
});
