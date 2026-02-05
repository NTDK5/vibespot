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
        style={[styles.card, { width: Math.min(width * 0.78, 340) }]}
        onPress={() =>
          navigation.navigate("SpotDetail", { spotId: spot.id })
        }
      >
        {/* Vibe Glow */}
        <View style={[styles.glow, { backgroundColor: hexToRgba(vibeColor, 0.35) }]} />

        {/* Image (top) */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: spot.images?.[0] || spot.thumbnail }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.55)"]}
            style={styles.imageFade}
          />

          {/* Rank Badge */}
          <View style={[styles.rankBadge, { borderColor: "rgba(255,255,255,0.22)" }]}>
            <Ionicons name="trophy" size={14} color="#fff" />
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        </View>

        {/* Content (bottom) */}
        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.background,
              borderTopColor: hexToRgba(vibeColor, 0.20),
            },
          ]}
        >
          <LinearGradient
            colors={[hexToRgba(vibeColor, 0.14), "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contentTint}
          />

          <View style={styles.contentInner}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {spot.title}
            </Text>

            {!!spot.address && (
              <Text numberOfLines={1} style={[styles.metaInfo, { color: theme.textMuted }]}>
                {spot.address}
              </Text>
            )}

            {!!spot.description && (
              <Text numberOfLines={2} style={[styles.description, { color: theme.textMuted }]}>
                {spot.description}
              </Text>
            )}

            <View style={styles.metaRow}>
              {topVibe && (
                <View style={[styles.vibePill, { backgroundColor: hexToRgba(vibeColor, 0.10), borderColor: hexToRgba(vibeColor, 0.22) }]}>
                  <Ionicons name="sparkles" size={12} color={vibeColor} />
                  <Text numberOfLines={1} style={[styles.vibeText, { color: theme.text }]}>
                    {topVibe.name}
                  </Text>
                </View>
              )}

              <View style={[styles.scorePill, { backgroundColor: theme.surfaceAlt || theme.surface, borderColor: theme.border }]}>
                <Ionicons name="star" size={12} color="#F5C542" />
                <Text style={[styles.scoreText, { color: theme.text }]}>
                  {spot.score?.toFixed(1)}
                </Text>
              </View>
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
      height: 320,
      borderRadius: 26,
      overflow: "hidden",
      marginRight: 16,
      backgroundColor: "#000",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      position: "absolute",
      inset: -10,
      borderRadius: 34,
      zIndex: -1,
    },
    imageWrap: {
      height: 176,
      width: "100%",
      position: "relative",
      backgroundColor: "#111",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    imageFade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120,
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
      backgroundColor: "rgba(0,0,0,0.35)",
      zIndex: 2,
    },
    rankText: {
      fontSize: 12,
      fontWeight: "900",
      color: "#fff",
    },
    content: {
      flex: 1,
      borderTopWidth: 4,
      paddingTop: 14,
      paddingBottom: 14,
      paddingHorizontal: 14,
    },
    contentTint: {
      ...StyleSheet.absoluteFillObject,
      opacity: 1,
    },
    contentInner: {
      flex: 1,
      gap: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
    metaInfo: {
      fontSize: 12,
      fontWeight: "600",
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
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
      marginTop: 6,
    },
    vibePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      maxWidth: "66%",
    },
    vibeText: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    scorePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
    },
    scoreText: {
      fontSize: 12,
      fontWeight: "800",
    },
  });
  