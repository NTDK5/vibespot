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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getCollectionById, likeCollection, deleteCollection } from "../services/collections.service";
import { useAuth } from "../hooks/useAuth";
import { SpotCard } from "../components/SpotCard";

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
    setLoading(true);
    try {
      const data = await getCollectionById(collectionId);
      if (!data.error) {
        setCollection(data);
      } else {
        Alert.alert("Error", data.error);
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading collection:", error);
      Alert.alert("Error", "Failed to load collection");
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
    try {
      const result = await likeCollection(collectionId);
      if (!result.error) {
        setCollection((prev) => ({
          ...prev,
          isLiked: result.liked,
          likeCount: result.likeCount,
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to like collection");
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Collection",
      "Are you sure you want to delete this collection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteCollection(collectionId);
            if (!result.error) {
              navigation.goBack();
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return null;
  }

  const coverImage =
    collection.coverImage ||
    collection.spots?.[0]?.spot?.thumbnail ||
    collection.spots?.[0]?.spot?.images?.[0];

  const isOwner = user?.id === collection.userId;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={collection.spots || []}
        keyExtractor={(item) => item.spot.id}
        ListHeaderComponent={
          <View>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="images-outline" size={64} color="#ccc" />
                </View>
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.coverGradient}
              />
              
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Collection Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.title}>{collection.title}</Text>
                {collection.description && (
                  <Text style={styles.description}>{collection.description}</Text>
                )}
                
                <View style={styles.metaRow}>
                  <View style={styles.userInfo}>
                    {collection.user?.profileImage ? (
                      <Image
                        source={{ uri: collection.user.profileImage }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={16} color="#666" />
                      </View>
                    )}
                    <Text style={styles.authorName}>{collection.user?.name || "Unknown"}</Text>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="location" size={16} color="#fff" />
                      <Text style={styles.statText}>
                        {collection.spotCount || collection.spots?.length || 0} spots
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={handleLike}
                    >
                      <Ionicons
                        name={collection.isLiked ? "heart" : "heart-outline"}
                        size={20}
                        color={collection.isLiked ? "#ff4444" : "#fff"}
                      />
                      <Text style={styles.likeCount}>
                        {collection.likeCount || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Spots Header */}
            <View style={styles.spotsHeader}>
              <Text style={styles.spotsHeaderTitle}>
                Spots ({collection.spotCount || collection.spots?.length || 0})
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.spotWrapper}>
            <SpotCard
              spot={item.spot}
              onPress={() =>
                navigation.navigate("SpotDetail", { spotId: item.spot.id })
              }
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No spots in this collection</Text>
          </View>
        }
      />
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
  coverContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  coverGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,68,68,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  likeCount: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  spotsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  spotsHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  listContent: {
    padding: 20,
  },
  spotWrapper: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "600",
  },
});

