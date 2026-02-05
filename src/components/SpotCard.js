import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSpotVibes } from "../hooks/useSpotVibes";
import { LinearGradient } from "expo-linear-gradient";
import { getStars } from "../utils/helpers";
import { useTheme } from "../context/ThemeContext";


const { width } = Dimensions.get("window");
const safeHex = (color, fallback = "#111111") => {
  if (!color) return fallback;
  if (/^#([0-9A-F]{6})$/i.test(color)) return color;
  return fallback;
};

const hexToRgba = (hex, alpha = 1) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const SpotCard = ({ spot, onPress }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme()
  const { data: spotVibes = [] } = useSpotVibes(spot.id);

  const topVibe =
    spotVibes.length > 0
      ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
      : theme.surface;

  const rawVibeColor = topVibe?.color;
  const vibeColor = safeHex(rawVibeColor, "#1a1a1a");

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          shadowColor: vibeColor,
          opacity: scrollY.interpolate({
            inputRange: [0, 200],
            outputRange: [1, 0.9],
            extrapolate: "clamp",
          }),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.spotCard, { backgroundColor: vibeColor }]}
        onPress={onPress}
      >
        {/* Image */}
        <Image
          source={{ uri: spot.images?.[0] || spot.thumbnail }}
          style={styles.spotImage}
        />

        {/* Vibe-tinted overlay */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            hexToRgba(vibeColor, 0.45),
            "rgba(0,0,0,0.95)",
          ]}
          style={styles.gradient}
        />


        {/* Like */}
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons name="heart-outline" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Category */}
        <View
          style={[
            styles.categoryPill,
            { backgroundColor: hexToRgba(vibeColor, 0.85) },
          ]}
        >
          <Text style={styles.categoryText}>
            {spot.category?.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>
            {spot.title}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color="#fff" />
            <Text numberOfLines={1} style={styles.address}>
              {spot.address}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View
              style={[
                styles.glassBadge,
                { borderColor: hexToRgba(vibeColor, 0.6), },
              ]}
            >
              <Ionicons name="cash" size={12} color="#fff" />
              <Text style={styles.badgeText}>
                {spot.priceRange?.toUpperCase()}
              </Text>
            </View>

            {spot.ratingAvg > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {spot.ratingAvg.toFixed(1)}
                </Text>
              </View>
            )}

            <View style={styles.glassBadge}>
              <Ionicons name="images" size={12} color="#fff" />
              <Text style={styles.badgeText}>
                {spot.images?.length || 0}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


const styles = StyleSheet.create({
  wrapper: {
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },

  spotCard: {
    width: width * 0.6,
    height: 240,
    borderRadius: 18,
    overflow: "hidden",
  },

  spotImage: {
    ...StyleSheet.absoluteFillObject,
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  likeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 10,
    borderRadius: 18,
  },

  categoryPill: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  content: {
    position: "absolute",
    bottom: 0,
    padding: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },

  address: {
    color: "#eee",
    fontSize: 12,
    flex: 1,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  glassBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  ratingText: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 12,
  },
});
