import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { truncateText, getStars } from '../utils/helpers';

/**
 * Place Card Component
 * Displays a place in list/grid view
 */
export const PlaceCard = ({ place, onPress }) => {
  const stars = getStars(place.averageRating || 0);
  const priceRange = place.priceRange || 0;
  const priceLabels = ['Free', '$', '$$', '$$$', '$$$$'];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: place.mainImage || 'https://via.placeholder.com/300' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {place.title}
          </Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{priceLabels[priceRange] || 'Free'}</Text>
          </View>
        </View>
        
        <Text style={styles.category}>{place.category}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[...Array(stars.full)].map((_, i) => (
              <Ionicons key={i} name="star" size={14} color="#FFD700" />
            ))}
            {stars.half > 0 && (
              <Ionicons name="star-half" size={14} color="#FFD700" />
            )}
            {[...Array(stars.empty)].map((_, i) => (
              <Ionicons key={i} name="star-outline" size={14} color="#FFD700" />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {place.averageRating?.toFixed(1) || '0.0'} ({place.reviewCount || 0})
          </Text>
        </View>

        {place.description && (
          <Text style={styles.description} numberOfLines={2}>
            {truncateText(place.description, 80)}
          </Text>
        )}

        {place.tags && place.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {place.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priceBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
});

