// import {
//   collection,
//   doc,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   getDoc,
//   getDocs,
//   query,
//   where,
//   orderBy,
//   limit,
//   serverTimestamp,
// } from 'firebase/firestore';
// import { db } from '../firebase/config';

// /**
//  * Manually recalculate average rating for a place
//  * (Used when Cloud Functions are not available)
//  */
// export const recalculatePlaceRating = async (placeId) => {
//   try {
//     const reviewsSnapshot = await getDocs(
//       query(collection(db, REVIEWS_COLLECTION), where('placeId', '==', placeId))
//     );

//     if (reviewsSnapshot.empty) {
//       await updateDoc(doc(db, PLACES_COLLECTION, placeId), {
//         averageRating: 0,
//         reviewCount: 0,
//       });
//       return { averageRating: 0, reviewCount: 0 };
//     }

//     let totalRating = 0;
//     let reviewCount = 0;

//     reviewsSnapshot.forEach((reviewDoc) => {
//       const review = reviewDoc.data();
//       totalRating += review.rating || 0;
//       reviewCount += 1;
//     });

//     const averageRating = Math.round((totalRating / reviewCount) * 10) / 10;

//     await updateDoc(doc(db, PLACES_COLLECTION, placeId), {
//       averageRating,
//       reviewCount,
//     });

//     return { averageRating, reviewCount };
//   } catch (error) {
//     console.error('Error recalculating rating:', error);
//     return { error: error.message };
//   }
// };

// /**
//  * Reviews Service
//  * Handles CRUD operations for reviews
//  */

// const REVIEWS_COLLECTION = 'reviews';
// const PLACES_COLLECTION = 'places';

// /**
//  * Add a review
//  */
// export const addReview = async (placeId, userId, reviewData) => {
//   try {
//     const reviewRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
//       placeId,
//       userId,
//       rating: reviewData.rating,
//       comment: reviewData.comment || '',
//       imageUrl: reviewData.imageUrl || null,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });

//     // Recalculate average rating (manual since Cloud Functions are disabled)
//     await recalculatePlaceRating(placeId).catch(err =>
//       console.warn('Rating recalculation failed:', err)
//     );

//     return { id: reviewRef.id, error: null };
//   } catch (error) {
//     return { id: null, error: error.message };
//   }
// };

// /**
//  * Update a review
//  */
// export const updateReview = async (reviewId, reviewData) => {
//   try {
//     const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
//     const reviewDoc = await getDoc(reviewRef);
    
//     if (!reviewDoc.exists()) {
//       return { error: 'Review not found' };
//     }

//     await updateDoc(reviewRef, {
//       rating: reviewData.rating,
//       comment: reviewData.comment || '',
//       imageUrl: reviewData.imageUrl || reviewDoc.data().imageUrl,
//       updatedAt: serverTimestamp(),
//     });

//     // Recalculate average rating (manual since Cloud Functions are disabled)
//     const placeId = reviewDoc.data().placeId;
//     await recalculatePlaceRating(placeId).catch(err =>
//       console.warn('Rating recalculation failed:', err)
//     );

//     return { error: null };
//   } catch (error) {
//     return { error: error.message };
//   }
// };

// /**
//  * Delete a review
//  */
// export const deleteReview = async (reviewId) => {
//   try {
//     const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
//     const reviewDoc = await getDoc(reviewRef);
    
//     if (!reviewDoc.exists()) {
//       return { error: 'Review not found' };
//     }

//     const placeId = reviewDoc.data().placeId;
//     await deleteDoc(reviewRef);

//     // Recalculate average rating (manual since Cloud Functions are disabled)
//     await recalculatePlaceRating(placeId).catch(err =>
//       console.warn('Rating recalculation failed:', err)
//     );

//     return { error: null };
//   } catch (error) {
//     return { error: error.message };
//   }
// };

// /**
//  * Get all reviews for a place
//  */
// export const getReviewsByPlace = async (placeId, limitCount = 50) => {
//   try {
//     const q = query(
//       collection(db, REVIEWS_COLLECTION),
//       where('placeId', '==', placeId),
//       orderBy('createdAt', 'desc'),
//       limit(limitCount)
//     );
//     const querySnapshot = await getDocs(q);
    
//     return querySnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//   } catch (error) {
//     console.error('Error getting reviews:', error);
//     return [];
//   }
// };

// /**
//  * Get all reviews by a user
//  */
// export const getReviewsByUser = async (userId) => {
//   try {
//     const q = query(
//       collection(db, REVIEWS_COLLECTION),
//       where('userId', '==', userId),
//       orderBy('createdAt', 'desc')
//     );
//     const querySnapshot = await getDocs(q);
    
//     return querySnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//   } catch (error) {
//     console.error('Error getting user reviews:', error);
//     return [];
//   }
// };

// /**
//  * Get a single review
//  */
// export const getReview = async (reviewId) => {
//   try {
//     const reviewDoc = await getDoc(doc(db, REVIEWS_COLLECTION, reviewId));
//     if (reviewDoc.exists()) {
//       return {
//         id: reviewDoc.id,
//         ...reviewDoc.data(),
//       };
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting review:', error);
//     return null;
//   }
// };

// /**
//  * Check if user has already reviewed a place
//  */
// export const getUserReviewForPlace = async (placeId, userId) => {
//   try {
//     const q = query(
//       collection(db, REVIEWS_COLLECTION),
//       where('placeId', '==', placeId),
//       where('userId', '==', userId),
//       limit(1)
//     );
//     const querySnapshot = await getDocs(q);
    
//     if (!querySnapshot.empty) {
//       const doc = querySnapshot.docs[0];
//       return {
//         id: doc.id,
//         ...doc.data(),
//       };
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting user review:', error);
//     return null;
//   }
// };

