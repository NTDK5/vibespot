import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlace } from '../services/places';
import {
  getReviewsByPlace,
  addReview,
  updateReview,
  deleteReview,
  getUserReviewForPlace,
} from '../services/reviews';
import { uploadReviewImage } from '../services/upload';
import { ReviewCard } from '../components/ReviewCard';
import { Button } from '../components/Button';
// import { useAuth } from '../hooks/useAuth';
import { formatDate, getStars } from '../utils/helpers';
import { pickImage } from '../services/upload';

/**
 * Place Detail Screen
 * Shows place details and reviews
 */
export const PlaceDetailScreen = ({ route, navigation }) => {
  const { placeId } = route.params;
  // const { user, isAdmin } = useAuth();
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlace();
    loadReviews();
  }, [placeId, user]);

  const loadPlace = async () => {
    try {
      const data = await getPlace(placeId);
      setPlace(data);
    } catch (error) {
      console.error('Error loading place:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await getReviewsByPlace(placeId);
      setReviews(data);

      if (user) {
        const review = await getUserReviewForPlace(placeId, user.uid);
        setUserReview(review);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handlePickReviewImage = async () => {
    const image = await pickImage();
    if (image) {
      setReviewImage(image);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to leave a review');
      return;
    }

    if (!rating) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = null;
      if (reviewImage) {
        const uploadResult = await uploadReviewImage(
          reviewImage.uri,
          userReview?.id || 'temp'
        );
        if (uploadResult.url) {
          imageUrl = uploadResult.url;
        }
      }

      if (userReview) {
        // Update existing review
        await updateReview(userReview.id, {
          rating,
          comment,
          imageUrl: imageUrl || userReview.imageUrl,
        });
        Alert.alert('Success', 'Review updated successfully');
      } else {
        // Create new review
        await addReview(placeId, user.uid, {
          rating,
          comment,
          imageUrl,
        });
        Alert.alert('Success', 'Review added successfully');
      }

      setReviewModalVisible(false);
      setRating(5);
      setComment('');
      setReviewImage(null);
      loadReviews();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReview(reviewId);
            loadReviews();
          },
        },
      ]
    );
  };

  if (loading || !place) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const stars = getStars(place.averageRating || 0);
  const priceLabels = ['Free', '$', '$$', '$$$', '$$$$'];

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: place.mainImage || 'https://via.placeholder.com/400' }}
        style={styles.mainImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{place.title}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {priceLabels[place.priceRange] || 'Free'}
            </Text>
          </View>
        </View>

        <Text style={styles.category}>{place.category}</Text>

        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[...Array(stars.full)].map((_, i) => (
              <Ionicons key={i} name="star" size={20} color="#FFD700" />
            ))}
            {stars.half > 0 && (
              <Ionicons name="star-half" size={20} color="#FFD700" />
            )}
            {[...Array(stars.empty)].map((_, i) => (
              <Ionicons key={i} name="star-outline" size={20} color="#FFD700" />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {place.averageRating?.toFixed(1) || '0.0'} ({place.reviewCount || 0} reviews)
          </Text>
        </View>

        {place.description && (
          <Text style={styles.description}>{place.description}</Text>
        )}

        {place.tags && place.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {place.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {user && !userReview && (
            <Button
              title="Add Review"
              onPress={() => setReviewModalVisible(true)}
              style={styles.addReviewButton}
            />
          )}

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                user={{ displayName: 'User' }} // TODO: Fetch user data
                canEdit={user && review.userId === user.uid}
                canDelete={user && (review.userId === user.uid || isAdmin)}
                onEdit={() => {
                  setRating(review.rating);
                  setComment(review.comment || '');
                  setReviewImage(review.imageUrl ? { uri: review.imageUrl } : null);
                  setUserReview(review);
                  setReviewModalVisible(true);
                }}
                onDelete={() => handleDeleteReview(review.id)}
              />
            ))
          )}
        </View>
      </View>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {userReview ? 'Edit Review' : 'Add Review'}
              </Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Rating</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setRating(value)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={value <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Comment</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your review..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickReviewImage}
            >
              {reviewImage ? (
                <Image
                  source={{ uri: reviewImage.uri || reviewImage }}
                  style={styles.reviewImagePreview}
                />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={32} color="#007AFF" />
                  <Text style={styles.imagePickerText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Button
              title={userReview ? 'Update Review' : 'Submit Review'}
              onPress={handleSubmitReview}
              loading={submitting}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addReviewButton: {
    marginBottom: 16,
  },
  noReviews: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    marginHorizontal: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imagePicker: {
    marginBottom: 24,
  },
  imagePickerPlaceholder: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  reviewImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 8,
  },
});

