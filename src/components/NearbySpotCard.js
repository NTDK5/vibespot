import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSpotVibes } from "../hooks/useSpotVibes";

const safeHex = (color, fallback = "#1f1f1f") => {
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

export const NearbySpotCard = ({ spot, onPress }) => {
    
  const { data: spotVibes = [] } = useSpotVibes(spot.id);

  const topVibe =
    spotVibes.length > 0
      ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
      : null;

  const vibeColor = safeHex(topVibe?.color, "#242424");

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: hexToRgba(vibeColor, 0.95) },
      ]}
    >
      {/* IMAGE */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: spot.images?.[0] || spot.thumbnail }}
          style={styles.image}
        />

        {/* vibe accent */}
        <View
          style={[
            styles.imageAccent,
            { backgroundColor: vibeColor },
          ]}
        />
      </View>

      {/* DETAILS */}
      <View style={styles.info}>
        {/* title + rating */}
        <View style={styles.header}>
          <Text numberOfLines={1} style={styles.title}>
            {spot.title}
          </Text>

          {spot.ratingAvg > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>
                {spot.ratingAvg.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* address */}
        <View style={styles.addressRow}>
          <Ionicons name="location" size={12} color="#ccc" />
          <Text numberOfLines={1} style={styles.address}>
            {spot.address}
          </Text>
        </View>

        {/* description preview */}
        {spot.description && (
          <Text numberOfLines={2} style={styles.description}>
            {spot.description}
          </Text>
        )}

        {/* tags */}
        {spot.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {spot.tags.slice(0, 3).map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: hexToRgba(vibeColor, 0.9),borderRadius: 14 },
                ]}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* footer */}
        <View style={styles.footer}>
          {spot.distance && (
            <View style={styles.pill}>
              <Ionicons name="navigate" size={12} color="#fff" />
              <Text style={styles.pillText}>
                {(spot.distance / 1000).toFixed(1)} km
              </Text>
            </View>
          )}

          {spot.bestTime && (
            <View style={styles.bestTime}>
              <Ionicons name="time" size={12} color="#fff" />
              <Text style={styles.bestTimeText}>
                {spot.bestTime}
              </Text>
            </View>
          )}

          <View style={styles.pricePill}>
            <Text style={styles.priceText}>
              {spot.priceRange?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    card: {
      flexDirection: "row",
      width: "100%",
      height: 140,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 10,
      shadowColor: "#000",
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 7,
    },
  
    imageWrap: {
      width: 120,
      height: "100%",
      position: "relative",
    },
  
    image: {
      width: "100%",
      height: "100%",
    },
  
    imageAccent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: 5,
    },
  
    info: {
      flex: 1,
      padding: 12,
      justifyContent: "space-between",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
  
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
  
    title: {
      fontSize: 16,
      fontWeight: "900",
      color: "#fff",
      flex: 1,
    },
  
    category: {
      fontSize: 12,
      color: "#ddd",
      textTransform: "capitalize",
    },
  
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
  
    pillText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
  
    rating: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
  
    ratingText: {
      color: "#FFD700",
      fontWeight: "800",
      fontSize: 12,
    },
  
    pricePill: {
      backgroundColor: "rgba(0,0,0,0.45)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
  
    priceText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
    },
    description: {
        fontSize: 12,
        color: "#f0f0f0",
        marginTop: 6,
        lineHeight: 16,
      },
    
      tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 6,
      },
      addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
      },
    
      address: {
        fontSize: 12,
        color: "#e0e0e0",
        flex: 1,
      },
      bestTime:{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
      },
      bestTimeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
      },
      tag:{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
      },
      tagText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
      }
  });
  