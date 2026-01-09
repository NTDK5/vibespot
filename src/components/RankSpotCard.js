import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSpotVibes } from "../hooks/useSpotVibes";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

/* ---------------------------
   Color Helpers
---------------------------- */
const safeHex = (color, fallback = "#6C5CE7") => {
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

/* ---------------------------
   Component
---------------------------- */
export const RankSpotCard = ({ spot: rankItem, navigation }) => {
    const { spot, rank, score } = rankItem;
    const { data: spotVibes = [] } = useSpotVibes(spot.id);
    const { theme } = useTheme();
    const topVibe =
      spotVibes.length > 0
        ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
        : theme.surface;
  
    const vibeColor = safeHex(topVibe?.color);
  
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, { width: width * 0.7 }]}
        onPress={() =>
          navigation.navigate("SpotDetail", { spotId: spot.id })
        }
      >
        {/* Vibe Glow */}
        <View
          style={[styles.glow, { backgroundColor: hexToRgba(vibeColor, 0.45) }]}
        />
  
        {/* Gradient Background */}
        <LinearGradient
          colors={[hexToRgba(vibeColor, 0.9), hexToRgba(vibeColor, 0.4), "#000"]}
          style={styles.background}
        />
  
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { borderColor: vibeColor }]}>
          <Ionicons name="trophy" size={16} color={vibeColor} />
          <Text style={[styles.rankText, { color: vibeColor }]}>#{rank}</Text>
        </View>
  
        {/* Image */}
        <Image
          source={{ uri: spot.images?.[0] || spot.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
  
        {/* Bottom Fade */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.9)"]}
          style={styles.fade}
        />
  
        {/* Content */}
        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>
            {spot.title}
          </Text>
  
          {/* Category & Address */}
          <Text style={styles.metaInfo}>
            · {spot.address}
          </Text>
  
          {/* Description snippet */}
          <Text numberOfLines={2} style={styles.description}>
            {spot.description}
          </Text>
  
          {/* Features */}
          {/* <View style={styles.featuresRow}>
            {spot.features?.slice(0, 3).map((feature, idx) => (
              <View key={idx} style={styles.featurePill}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View> */}
  
          {/* Vibes and Score */}
          <View style={styles.metaRow}>
            {topVibe && (
              <View
                style={[styles.vibePill, { backgroundColor: hexToRgba(vibeColor, 0.25) }]}
              >
                <Ionicons name="sparkles" size={12} color={vibeColor} />
                <Text style={styles.vibeText}>{topVibe.name}</Text>
              </View>
            )}
  
            <View style={styles.scorePill}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.scoreText}>{spot.score?.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  /* --------------------------- */
  /* Add/Update Styles */
  const styles = StyleSheet.create({
    card: {
      height: 280,
      borderRadius: 22,
      overflow: "hidden",
      marginRight: 16,
    },
    glow: {
      position: "absolute",
      inset: -10,
      borderRadius: 30,
      zIndex: -1,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
    },
    image: {
      width: "100%",
      height: 160,
    },
    fade: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 180,
    },
    rankBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      zIndex: 2,
    },
    rankText: {
      fontSize: 12,
      fontWeight: "900",
    },
    content: {
      position: "absolute",
      bottom: 14,
      left: 14,
      right: 14,
    },
    title: {
      fontSize: 18,
      fontWeight: "900",
      color: "#fff",
      marginBottom: 4,
    },
    metaInfo: {
      fontSize: 12,
      color: "#ccc",
      marginBottom: 4,
    },
    description: {
      fontSize: 12,
      color: "#eee",
      marginBottom: 6,
    },
    featuresRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 6,
    },
    featurePill: {
      backgroundColor: "rgba(255,255,255,0.1)",
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 12,
    },
    featureText: {
      fontSize: 10,
      color: "#fff",
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    vibePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    vibeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#fff",
      textTransform: "capitalize",
    },
    scorePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    scoreText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#FFD700",
    },
  });
  