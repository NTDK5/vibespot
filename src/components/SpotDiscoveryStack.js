/**
 * SpotDiscoveryStack - Signature VibeSpot interaction
 * Stack-based cards with tilt-on-scroll and mood-reactive transitions
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSpotVibes } from '../hooks/useSpotVibes';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;
const CARD_HEIGHT = 280;
const STACK_OFFSET = 12;

const hexToRgba = (hex, alpha = 1) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const SpotDiscoveryStack = ({ spots = [], onPressSpot }) => {
  const { theme } = useTheme();
  const scrollAnim = useRef(new Animated.Value(0)).current;

  if (!spots || spots.length === 0) return null;

  const topSpot = spots[0];
  const restSpots = [...spots.slice(1, 4)].reverse();

  return (
    <View style={styles.container}>
      {restSpots.map((spot, idx) => (
        <View
          key={spot.id}
          style={[
            styles.stackCard,
            {
              top: STACK_OFFSET * (restSpots.length - idx),
              transform: [
                { scale: 1 - (restSpots.length - idx) * 0.03 },
                { translateY: (restSpots.length - idx) * 4 },
              ],
              zIndex: restSpots.length - idx,
            },
          ]}
        />
      ))}

      <SpotDiscoveryCard
        spot={topSpot}
        onPress={() => onPressSpot?.(topSpot)}
      />
    </View>
  );
};

const SpotDiscoveryCard = ({ spot, onPress }) => {
  const { theme } = useTheme();
  const { data: spotVibes = [] } = useSpotVibes(spot?.id);
  const topVibe = spotVibes.length > 0
    ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
    : null;
  const vibeColor = topVibe?.color || theme.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={[styles.card, { shadowColor: vibeColor }]}
    >
      <Image
        source={{ uri: spot?.images?.[0] || spot?.thumbnail }}
        style={styles.image}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', hexToRgba(vibeColor, 0.5), 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      <View style={[styles.topBadge, { backgroundColor: hexToRgba(vibeColor, 0.85) }]}>
        <Text style={styles.categoryText}>{spot?.category?.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{spot?.title}</Text>
        <View style={styles.meta}>
          <Ionicons name="location" size={12} color="#eee" />
          <Text style={styles.address} numberOfLines={1}>{spot?.address}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.priceBadge}>
            <Ionicons name="pricetag" size={12} color="#fff" />
            <Text style={styles.priceText}>{spot?.priceRange?.toUpperCase()}</Text>
          </View>
          {topVibe && (
            <View style={[styles.vibeChip, { backgroundColor: hexToRgba(vibeColor, 0.8) }]}>
              <Text style={styles.vibeChipText}>{topVibe.name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    minHeight: CARD_HEIGHT + 80,
  },
  stackCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    opacity: 0.7,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  address: {
    color: '#eee',
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  vibeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vibeChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
