import React, { useRef, useEffect } from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, FlatList, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

/**
 * EditorsPickCarousel
 *
 * Premium hero-style carousel for Editor's Picks.
 * - Large, full-bleed cards
 * - Auto + manual scroll
 * - Editorial, minimal, marketing-focused
 */
export const EditorsPickCarousel = ({ spots = [], onPressSpot }) => {
  const { theme } = useTheme();
  const listRef = useRef(null);
  const indexRef = useRef(0);

  // Auto-scroll between cards (only when multiple items)
  useEffect(() => {
    if (!spots || spots.length <= 1) return;

    const interval = setInterval(() => {
      if (!listRef.current) return;
      indexRef.current = (indexRef.current + 1) % spots.length;
      listRef.current.scrollToIndex({
        index: indexRef.current,
        animated: true,
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [spots]);

  if (!spots || spots.length === 0) return null;

  const renderItem = ({ item, index }) => {
    const isFirst = index === 0;
    const imageSource = { uri: item.thumbnail || item.images?.[0] };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressSpot && onPressSpot(item)}
        style={[
          styles.cardOuter,
          {
            shadowColor: theme.shadowMd || "#000",
            transform: [{ scale: isFirst ? 1 : 0.97 }],
          },
        ]}
      >
        <ImageBackground
          source={imageSource}
          style={styles.card}
          imageStyle={styles.cardImage}
        >
          {/* Gradient overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
            style={styles.gradient}
          />

          {/* Top badge */}
          <View style={styles.topRow}>
            <View style={styles.editorsBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.editorsBadgeText}>
                {item.isEditorsPick ? "Editor’s Pick" : "Featured"}
              </Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.bottomContent}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>

            <View style={styles.metaRow}>
              {item.address && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#F5F5F5" />
                  <Text numberOfLines={1} style={styles.locationText}>
                    {item.address}
                  </Text>
                </View>
              )}
            </View>

            {/* Vibe chips */}
            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <View style={styles.chipRow}>
                {item.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA row */}
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Explore</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="#FFFFFF" />
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item) => item.id;

  const renderDots = () => {
    if (!spots || spots.length <= 1) return null;
    return (
      <View style={styles.dotsRow}>
        {spots.map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>
    );
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={spots}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />
      {renderDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
  },
  cardOuter: {
    width: CARD_WIDTH,
    height: 260,
    marginRight: 16,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  cardImage: {
    borderRadius: 24,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editorsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  editorsBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
  },
  bottomContent: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  locationText: {
    marginLeft: 4,
    color: "#F5F5F5",
    fontSize: 13,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginRight: 6,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 2,
  },
  ctaText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginHorizontal: 3,
  },
});

export default EditorsPickCarousel;

