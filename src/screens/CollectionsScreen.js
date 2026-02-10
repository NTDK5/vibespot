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
} from "../services/collections.service";
import { getAllSpots } from "../services/spots.service";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button";
import { useTheme } from "../context/ThemeContext";

export const CollectionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("popular"); // "popular" or "recent"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCollections, setFilteredCollections] = useState([]);

  // Create collection form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [availableSpots, setAvailableSpots] = useState([]);
  const [showSpotPicker, setShowSpotPicker] = useState(false);

  useEffect(() => {
    loadCollections();
  }, [sortBy]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCollections(collections);
    } else {
      const filtered = collections.filter(
        (collection) =>
          collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCollections(filtered);
    }
  }, [searchQuery, collections]);

  const loadCollections = async () => {
    try {
      const data = await getAllCollections({
        isPublic: true,
        sortBy,
        limit: 50,
      });
      if (!data.error) {
        const collectionsData = Array.isArray(data) ? data : [];
        setCollections(collectionsData);
        setFilteredCollections(collectionsData);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollections();
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
        setFilteredCollections((prev) =>
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
        style={styles.fullCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("CollectionDetail", {
            collectionId: item.id,
          })
        }
      >
        <Image
          source={{ uri: coverImage }}
          style={styles.fullCardImage}
        />
  
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
          style={styles.fullCardGradient}
        />
  
        {/* Top actions */}
        <View style={styles.fullCardTop}>
          <View style={styles.authorRow}>
            {item.user?.profileImage ? (
              <Image
                source={{ uri: item.user.profileImage }}
                style={styles.authorAvatar}
              />
            ) : (
              <View style={styles.authorAvatarPlaceholder}>
                <Ionicons name="person" size={14} color="#666" />
              </View>
            )}
            <Text style={styles.authorName} numberOfLines={1}>
              {item.user?.name || "Unknown"}
            </Text>
          </View>
  
          {isMine && (
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
  
        {/* Bottom content */}
        <View style={styles.fullCardBottom}>
          <Text style={styles.fullCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
  
          {item.description && (
            <Text style={styles.fullCardDesc} numberOfLines={1}>
              {item.description}
            </Text>
          )}
  
          <View style={styles.fullMetaRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.metaText}>
                {item.spotCount || 0} spots
              </Text>
            </View>
  
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => handleLike(item.id, item.isLiked)}
            >
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={18}
                color={item.isLiked ? "#ff4d6d" : "#fff"}
              />
              <Text style={styles.likeCount}>
                {item.likeCount || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            shadowColor: theme.shadowSm,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Collections
        </Text>
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.shadowMd || theme.primary,
            },
          ]}
          onPress={() => {
            loadAvailableSpots();
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={theme.textSubtle || theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search collections..."
          placeholderTextColor={theme.textSubtle || theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.searchClearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.textSubtle || theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Tabs */}
      <View
        style={[
          styles.sortTabs,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.sortTab, sortBy === "popular" && styles.sortTabActive]}
          onPress={() => setSortBy("popular")}
        >
          <Text
            style={[
              styles.sortTabText,
              sortBy === "popular" && styles.sortTabTextActive,
                {
                  color:
                    sortBy === "popular" ? theme.background : theme.textMuted,
                },
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
                {
                  color:
                    sortBy === "recent" ? theme.background : theme.textMuted,
                },
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCollections}
        renderItem={({ item }) => renderCollectionCard({ item })}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          searchQuery.trim() !== "" ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={64}
                color={theme.textSubtle || theme.textMuted}
              />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No collections found
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textMuted }]}
              >
                Try a different search term
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="albums-outline"
                size={64}
                color={theme.textSubtle || theme.textMuted}
              />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No collections yet
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textMuted }]}
              >
                Be the first to create a collection!
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        numColumns={1}
      />

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Create Collection
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: theme.text }]}>
              Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="e.g., Perfect Date Spots"
              placeholderTextColor={theme.textSubtle || theme.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: theme.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Describe your collection..."
              placeholderTextColor={theme.textSubtle || theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: theme.text }]}>
              Spots ({selectedSpots.length} selected)
            </Text>
            <TouchableOpacity
              style={[
                styles.spotPickerButton,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.primarySoft,
                },
              ]}
              onPress={() => setShowSpotPicker(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.primary}
              />
              <Text
                style={[styles.spotPickerText, { color: theme.primary }]}
              >
                Add Spots
              </Text>
            </TouchableOpacity>

            {selectedSpots.length > 0 && (
              <View style={styles.selectedSpots}>
                {selectedSpots.map((spot) => (
                  <View key={spot.id} style={styles.selectedSpotChip}>
                    <Text
                      style={[styles.selectedSpotText, { color: theme.primary }]}
                    >
                      {spot.title}
                    </Text>
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
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity onPress={() => setShowSpotPicker(false)}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Spots
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={availableSpots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedSpots.find((s) => s.id === item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.spotItem,
                    {
                      backgroundColor: theme.surface,
                      shadowColor: theme.shadowSm,
                    },
                  ]}
                  onPress={() => toggleSpotSelection(item)}
                >
                  <Image
                    source={{ uri: item.thumbnail || item.images?.[0] }}
                    style={styles.spotItemImage}
                  />
                  <View style={styles.spotItemInfo}>
                    <Text
                      style={[styles.spotItemTitle, { color: theme.text }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.spotItemCategory, { color: theme.textMuted }]}
                    >
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
  },
  searchClearButton: {
    padding: 4,
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
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  collectionCard: {
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
  fullCard: {
    width: "100%",
    height: 280,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  
  fullCardImage: {
    width: "100%",
    height: "100%",
  },
  
  fullCardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  
  fullCardTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 6,
  },
  
  authorAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    maxWidth: 140,
  },
  
  fullCardBottom: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  
  fullCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  
  fullCardDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 10,
  },
  
  fullMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  
  metaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  
});

