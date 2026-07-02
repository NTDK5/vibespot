import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getStars } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

/**
 * Review Card Component
 * Displays a single review
 */
export const ReviewCard = ({
  review,
  user,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const stars = getStars(review.rating);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="person" size={20} color={theme.textMuted} />
          </View>
          <View>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.displayName || 'Anonymous'}
            </Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>

        {(canEdit || canDelete) && (
          <View style={styles.actions}>
            {canEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Ionicons name="create-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.rating}>
        {[...Array(stars.full)].map((_, i) => (
          <Ionicons key={i} name="star" size={16} color="#FFD700" />
        ))}
        {stars.half > 0 && (
          <Ionicons name="star-half" size={16} color="#FFD700" />
        )}
        {[...Array(stars.empty)].map((_, i) => (
          <Ionicons key={i} name="star-outline" size={16} color="#FFD700" />
        ))}
        <Text style={[styles.ratingNumber, { color: theme.textMuted }]}>
          {review.rating}/5
        </Text>
      </View>

      {review.comment ? (
        <Text style={[styles.comment, { color: theme.text }]}>{review.comment}</Text>
      ) : null}

      {review.imageUrl ? (
        <Image
          source={{ uri: review.imageUrl }}
          style={styles.reviewImage}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
};

function createStyles(fieldGuide) {
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
    },
    date: {
      fontSize: 12,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: 4,
      marginLeft: 8,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    ratingNumber: {
      fontSize: 14,
      marginLeft: 8,
    },
    comment: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    reviewImage: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginTop: 8,
    },
  });
}
