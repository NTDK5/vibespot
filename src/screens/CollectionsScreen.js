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
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  getAllCollections,
  createCollection,
  deleteCollection,
  likeCollection,
  getUserCollections,
} from "../services/collections.service";
import { getAllSpots } from "../services/spots.service";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button";

export const CollectionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("popular"); // "popular" or "recent"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create collection form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [availableSpots, setAvailableSpots] = useState([]);
  const [showSpotPicker, setShowSpotPicker] = useState(false);

  useEffect(() => {
    loadCollections();
    if (user) {
      loadMyCollections();
    }
  }, [sortBy, user]);

  const loadCollections = async () => {
    try {
      const data = await getAllCollections({
        isPublic: true,
        sortBy,
        limit: 50,
      });
      if (!data.error) {
        setCollections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCollections = async () => {
    try {
      const data = await getUserCollections(user.id);
      if (!data.error) {
        setMyCollections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading my collections:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCollections(), user && loadMyCollections()]);
    setRefreshing(false);
  };

  const handleLike = async (collectionId, currentLiked) => {
    try {
      const result = await likeCollection(collectionId);
      if (!result.error) {
        // Update local state
        setCollections((prev) =>
          prev.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  isLiked: result.liked,
                  likeCount: result.likeCount,
                }
              : col
          )
        );
        setMyCollections((prev) =>
          prev.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  isLiked: result.liked,
                  likeCount: result.likeCount,
                }
              : col
          )
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to like collection");
    }
  };

  const handleDelete = async (collectionId) => {
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
              loadMyCollections();
              loadCollections();
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    setCreating(true);
    try {
      const result = await createCollection({
        title: title.trim(),
        description: description.trim() || null,
        spotIds: selectedSpots.map((s) => s.id),
        isPublic: true,
      });

      if (!result.error) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        setSelectedSpots([]);
        loadCollections();
        loadMyCollections();
        Alert.alert("Success", "Collection created successfully!");
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const loadAvailableSpots = async () => {
    try {
      const spots = await getAllSpots();
      if (!spots.error) {
        setAvailableSpots(Array.isArray(spots) ? spots : []);
      }
    } catch (error) {
      console.error("Error loading spots:", error);
    }
  };

  const toggleSpotSelection = (spot) => {
    setSelectedSpots((prev) => {
      const exists = prev.find((s) => s.id === spot.id);
      if (exists) {
        return prev.filter((s) => s.id !== spot.id);
      } else {
        return [...prev, spot];
      }
    });
  };

  const renderCollectionCard = ({ item, isMine = false }) => {
    const coverImage =
      item.coverImage ||
      item.spots?.[0]?.spot?.thumbnail ||
      item.spots?.[0]?.spot?.images?.[0];

    return (
      <TouchableOpacity
        style={styles.collectionCard}
        onPress={() => navigation.navigate("CollectionDetail", { collectionId: item.id })}
      >
        <View style={styles.collectionImageContainer}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.collectionImage} />
          ) : (
            <View style={styles.collectionImagePlaceholder}>
              <Ionicons name="images-outline" size={40} color="#ccc" />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.collectionGradient}
          />
          <View style={styles.collectionOverlay}>
            <View style={styles.collectionHeader}>
              <View style={styles.collectionUserInfo}>
                {item.user?.profileImage ? (
                  <Image
                    source={{ uri: item.user.profileImage }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={styles.userAvatarPlaceholder}>
                    <Ionicons name="person" size={16} color="#666" />
                  </View>
                )}
                <Text style={styles.collectionAuthor} numberOfLines={1}>
                  {item.user?.name || "Unknown"}
                </Text>
              </View>
              {isMine && (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.collectionFooter}>
              <Text style={styles.collectionTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={styles.collectionDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
              <View style={styles.collectionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={14} color="#fff" />
                  <Text style={styles.metaText}>{item.spotCount || 0} spots</Text>
                </View>
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => handleLike(item.id, item.isLiked)}
                >
                  <Ionicons
                    name={item.isLiked ? "heart" : "heart-outline"}
                    size={18}
                    color={item.isLiked ? "#ff4444" : "#fff"}
                  />
                  <Text style={styles.likeCount}>{item.likeCount || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            loadAvailableSpots();
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sort Tabs */}
      <View style={styles.sortTabs}>
        <TouchableOpacity
          style={[styles.sortTab, sortBy === "popular" && styles.sortTabActive]}
          onPress={() => setSortBy("popular")}
        >
          <Text
            style={[
              styles.sortTabText,
              sortBy === "popular" && styles.sortTabTextActive,
            ]}
          >
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortTab, sortBy === "recent" && styles.sortTabActive]}
          onPress={() => setSortBy("recent")}
        >
          <Text
            style={[
              styles.sortTabText,
              sortBy === "recent" && styles.sortTabTextActive,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={collections}
        renderItem={({ item }) => renderCollectionCard({ item })}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          myCollections.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Collections</Text>
              <FlatList
                horizontal
                data={myCollections}
                renderItem={({ item }) => renderCollectionCard({ item, isMine: true })}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Collection</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Perfect Date Spots"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your collection..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>
              Spots ({selectedSpots.length} selected)
            </Text>
            <TouchableOpacity
              style={styles.spotPickerButton}
              onPress={() => setShowSpotPicker(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#6C5CE7" />
              <Text style={styles.spotPickerText}>Add Spots</Text>
            </TouchableOpacity>

            {selectedSpots.length > 0 && (
              <View style={styles.selectedSpots}>
                {selectedSpots.map((spot) => (
                  <View key={spot.id} style={styles.selectedSpotChip}>
                    <Text style={styles.selectedSpotText}>{spot.title}</Text>
                    <TouchableOpacity
                      onPress={() => toggleSpotSelection(spot)}
                      style={styles.removeSpotButton}
                    >
                      <Ionicons name="close-circle" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Button
              title={creating ? "Creating..." : "Create Collection"}
              onPress={handleCreate}
              loading={creating}
              style={styles.createCollectionButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Spot Picker Modal */}
      <Modal
        visible={showSpotPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSpotPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSpotPicker(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Spots</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={availableSpots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedSpots.find((s) => s.id === item.id);
              return (
                <TouchableOpacity
                  style={styles.spotItem}
                  onPress={() => toggleSpotSelection(item)}
                >
                  <Image
                    source={{ uri: item.thumbnail || item.images?.[0] }}
                    style={styles.spotItemImage}
                  />
                  <View style={styles.spotItemInfo}>
                    <Text style={styles.spotItemTitle}>{item.title}</Text>
                    <Text style={styles.spotItemCategory}>
                      {item.category?.replace("_", " ")}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#6C5CE7" />
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.spotList}
          />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  createButton: {
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
  sortTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 12,
  },
  sortTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  sortTabActive: {
    backgroundColor: "#6C5CE7",
  },
  sortTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  sortTabTextActive: {
    color: "#fff",
  },
  section: {
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  collectionCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  collectionImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  collectionImage: {
    width: "100%",
    height: "100%",
  },
  collectionImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  collectionGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  collectionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  collectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  collectionUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  userAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  collectionAuthor: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  collectionFooter: {
    marginTop: 4,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  collectionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  likeCount: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  spotPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#6C5CE7",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f8f9ff",
  },
  spotPickerText: {
    fontSize: 16,
    color: "#6C5CE7",
    fontWeight: "600",
  },
  selectedSpots: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  selectedSpotChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  selectedSpotText: {
    fontSize: 14,
    color: "#6C5CE7",
    fontWeight: "600",
  },
  removeSpotButton: {
    padding: 2,
  },
  createCollectionButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  spotList: {
    padding: 20,
  },
  spotItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  spotItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  spotItemInfo: {
    flex: 1,
  },
  spotItemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  spotItemCategory: {
    fontSize: 13,
    color: "#666",
    textTransform: "capitalize",
  },
});

