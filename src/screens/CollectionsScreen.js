/**
 * Collections Screen - Bento Grid Architecture
 * Editorial mood-board layout with 2x2 cover collages
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { spacing, radius, shadows } from "../theme/tokens";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - spacing.md * 2 - CARD_GAP) / 2;

const getCoverImages = (item) => {
  const cover = item.coverImage;
  const spots = item.spots || [];
  const fromSpots = spots
    .slice(0, 4)
    .map((s) => s?.spot?.images?.[0] || s?.spot?.thumbnail)
    .filter(Boolean);
  const urls = cover ? [cover, ...fromSpots] : fromSpots;
  while (urls.length < 4) urls.push(null);
  return urls.slice(0, 4);
};

export const CollectionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [availableSpots, setAvailableSpots] = useState([]);
  const [showSpotPicker, setShowSpotPicker] = useState(false);

  useEffect(() => {
    loadCollections();
  }, [sortBy]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCollections(collections);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredCollections(
        collections.filter(
          (c) =>
            c.title?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        )
      );
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
        const arr = Array.isArray(data) ? data : [];
        setCollections(arr);
        setFilteredCollections(arr);
      }
    } catch (e) {
      console.error(e);
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
        const update = (prev) =>
          prev.map((col) =>
            col.id === collectionId
              ? { ...col, isLiked: result.liked, likeCount: result.likeCount }
              : col
          );
        setCollections(update);
        setFilteredCollections(update);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to like collection");
    }
  };

  const handleDelete = async (collectionId) => {
    Alert.alert("Delete Collection", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await deleteCollection(collectionId);
          if (!res.error) loadCollections();
          else Alert.alert("Error", res.error);
        },
      },
    ]);
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
        Alert.alert("Success", "Collection created!");
      } else Alert.alert("Error", result.error);
    } catch (e) {
      Alert.alert("Error", "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const loadAvailableSpots = async () => {
    try {
      const spots = await getAllSpots();
      if (!spots.error) setAvailableSpots(Array.isArray(spots) ? spots : []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSpotSelection = (spot) => {
    setSelectedSpots((prev) =>
      prev.some((s) => s.id === spot.id)
        ? prev.filter((s) => s.id !== spot.id)
        : [...prev, spot]
    );
  };

  const renderCollectionCard = ({ item }) => {
    const images = getCoverImages(item);
    const isMine = user?.id === item.userId;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.bentoCard, { backgroundColor: theme.surface }]}
        onPress={() =>
          navigation.navigate("CollectionDetail", { collectionId: item.id })
        }
      >
        <View style={styles.collage}>
          {images.map((uri, i) => (
            <View key={i} style={styles.collageCell}>
              {uri ? (
                <Image source={{ uri }} style={styles.collageImage} />
              ) : (
                <View
                  style={[
                    styles.collagePlaceholder,
                    { backgroundColor: theme.border },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={theme.textMuted}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.cardContent, { borderTopColor: theme.border }]}>
          <Text
            style={[styles.cardTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.cardMetaLeft}>
              {item.user?.profileImage ? (
                <Image
                  source={{ uri: item.user.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={12}
                    color={theme.primary}
                  />
                </View>
              )}
              <Text
                style={[styles.authorName, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                {item.user?.name || "Unknown"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={() => handleLike(item.id, item.isLiked)}
            >
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={16}
                color={item.isLiked ? "#FF4D6D" : theme.textMuted}
              />
              <Text style={[styles.likeCount, { color: theme.textMuted }]}>
                {item.likeCount || 0}
              </Text>
            </TouchableOpacity>
          </View>
          {isMine && (
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: theme.error + "20" }]}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={14} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingWrap}>
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Collections
        </Text>
        <Text style={[styles.headerSub, { color: theme.textMuted }]}>
          Curated mood boards
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
        <Ionicons
          name="search"
          size={20}
          color={theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search collections..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Pills */}
      <View style={styles.pillsRow}>
        {["popular", "recent"].map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.pill,
              sortBy === key && {
                backgroundColor: theme.primary,
              },
              sortBy !== key && { backgroundColor: theme.surface },
            ]}
            onPress={() => setSortBy(key)}
          >
            <Text
              style={[
                styles.pillText,
                { color: sortBy === key ? "#fff" : theme.text },
              ]}
            >
              {key === "popular" ? "Popular" : "Recent"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bento Grid */}
      <FlatList
        data={filteredCollections}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderCollectionCard}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[styles.emptyIconWrap, { backgroundColor: theme.surface }]}
            >
              <Ionicons
                name="albums-outline"
                size={48}
                color={theme.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? "No collections found" : "No collections yet"}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              {searchQuery
                ? "Try a different search"
                : "Create one to get started"}
            </Text>
          </View>
        }
      />

      {/* Create FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          loadAvailableSpots();
          setShowCreateModal(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.background },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                New Collection
              </Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
            >
              <Text style={[styles.label, { color: theme.text }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="e.g. Weekend Vibes"
                placeholderTextColor={theme.textMuted}
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
                placeholder="What's the vibe?"
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Text style={[styles.label, { color: theme.text }]}>
                Spots ({selectedSpots.length})
              </Text>
              <TouchableOpacity
                style={[
                  styles.spotPickerBtn,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.primarySoft,
                  },
                ]}
                onPress={() => setShowSpotPicker(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.spotPickerText, { color: theme.primary }]}>
                  Add spots
                </Text>
              </TouchableOpacity>
              {selectedSpots.length > 0 && (
                <View style={styles.chips}>
                  {selectedSpots.map((s) => (
                    <View
                      key={s.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: theme.primarySoft,
                          borderColor: theme.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.chipText, { color: theme.primary }]}
                        numberOfLines={1}
                      >
                        {s.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleSpotSelection(s)}
                      >
                        <Ionicons name="close" size={16} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <Button
                title={creating ? "Creating..." : "Create"}
                onPress={handleCreate}
                loading={creating}
                style={styles.createBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Spot Picker Modal */}
      <Modal
        visible={showSpotPicker}
        animationType="slide"
        onRequestClose={() => setShowSpotPicker(false)}
      >
        <SafeAreaView
          style={[styles.pickerContainer, { backgroundColor: theme.background }]}
        >
          <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowSpotPicker(false)}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              Add spots
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <FlatList
            data={availableSpots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.pickerList}
            renderItem={({ item }) => {
              const sel = selectedSpots.some((s) => s.id === item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: theme.surface,
                      borderColor: sel ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => toggleSpotSelection(item)}
                >
                  <Image
                    source={{ uri: item.thumbnail || item.images?.[0] }}
                    style={styles.pickerThumb}
                  />
                  <View style={styles.pickerInfo}>
                    <Text style={[styles.pickerItemTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.pickerItemCat, { color: theme.textMuted }]}>
                      {item.category?.replace("_", " ")}
                    </Text>
                  </View>
                  {sel && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 14,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    ...shadows.subtle,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 16 },
  pillsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 14, fontWeight: "600" },
  row: {
    paddingHorizontal: spacing.md,
    marginBottom: CARD_GAP,
    justifyContent: "space-between",
  },
  listContent: {
    paddingBottom: 100,
  },
  bentoCard: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  collage: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: CARD_WIDTH * 0.9,
  },
  collageCell: {
    width: "50%",
    height: "50%",
    padding: 1,
  },
  collageImage: {
    width: "100%",
    height: "100%",
  },
  collagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: spacing.sm,
    borderTopWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  authorName: {
    fontSize: 12,
    flex: 1,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: { fontSize: 12, fontWeight: "600" },
  deleteBtn: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    padding: 4,
    borderRadius: radius.xs,
  },
  empty: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  fab: {
    position: "absolute",
    bottom: spacing.xl + 16,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalScroll: { maxHeight: 400 },
  modalContent: { padding: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  spotPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  spotPickerText: { fontSize: 16, fontWeight: "600" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing.xs,
  },
  chipText: { flex: 1, fontSize: 13, maxWidth: 120 },
  createBtn: { marginTop: spacing.xl },
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 18, fontWeight: "700" },
  pickerList: { padding: spacing.md },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  pickerThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  pickerInfo: { flex: 1 },
  pickerItemTitle: { fontSize: 16, fontWeight: "700" },
  pickerItemCat: { fontSize: 13, marginTop: 2 },
});
