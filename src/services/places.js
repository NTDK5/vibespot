import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Places Service
 * Handles CRUD operations for places
 */

const PLACES_COLLECTION = 'places';

/**
 * Add a new place (Admin only)
 */
export const addPlace = async (placeData) => {
  try {
    const placeRef = await addDoc(collection(db, PLACES_COLLECTION), {
      ...placeData,
      location: new GeoPoint(placeData.latitude, placeData.longitude),
      createdAt: new Date(),
      updatedAt: new Date(),
      averageRating: 0,
      reviewCount: 0,
    });

    return { id: placeRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

/**
 * Update a place (Admin only)
 */
export const updatePlace = async (placeId, placeData) => {
  try {
    const placeRef = doc(db, PLACES_COLLECTION, placeId);
    await updateDoc(placeRef, {
      ...placeData,
      location: placeData.latitude && placeData.longitude
        ? new GeoPoint(placeData.latitude, placeData.longitude)
        : undefined,
      updatedAt: new Date(),
    });

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Delete a place (Admin only)
 */
export const deletePlace = async (placeId) => {
  try {
    await deleteDoc(doc(db, PLACES_COLLECTION, placeId));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Get a single place by ID
 */
export const getPlace = async (placeId) => {
  try {
    const placeDoc = await getDoc(doc(db, PLACES_COLLECTION, placeId));
    if (placeDoc.exists()) {
      const data = placeDoc.data();
      return {
        id: placeDoc.id,
        ...data,
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting place:', error);
    return null;
  }
};

/**
 * Get all places
 */
export const getAllPlaces = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, PLACES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      latitude: doc.data().location?.latitude,
      longitude: doc.data().location?.longitude,
    }));
  } catch (error) {
    console.error('Error getting places:', error);
    return [];
  }
};

/**
 * Get places by category
 */
export const getPlacesByCategory = async (category) => {
  try {
    const q = query(
      collection(db, PLACES_COLLECTION),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      latitude: doc.data().location?.latitude,
      longitude: doc.data().location?.longitude,
    }));
  } catch (error) {
    console.error('Error getting places by category:', error);
    return [];
  }
};

/**
 * Get places by tags
 */
export const getPlacesByTags = async (tags) => {
  try {
    const q = query(
      collection(db, PLACES_COLLECTION),
      where('tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      latitude: doc.data().location?.latitude,
      longitude: doc.data().location?.longitude,
    }));
  } catch (error) {
    console.error('Error getting places by tags:', error);
    return [];
  }
};

/**
 * Search places by title or description
 * Note: Firestore doesn't support full-text search natively
 * For production, consider using Algolia or similar
 */
export const searchPlaces = async (searchTerm) => {
  try {
    // This is a simple implementation
    // For better search, use Algolia or Cloud Functions
    const allPlaces = await getAllPlaces();
    const term = searchTerm.toLowerCase();
    
    return allPlaces.filter(place => 
      place.title?.toLowerCase().includes(term) ||
      place.description?.toLowerCase().includes(term) ||
      place.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get nearby places (within radius in km)
 * Note: Firestore doesn't support native geo queries
 * For production, use geohash or Cloud Functions with geospatial queries
 */
export const getNearbyPlaces = async (latitude, longitude, radiusKm = 10) => {
  try {
    // Get all places and filter by distance
    // For production, use geohash indexing or Cloud Functions
    const allPlaces = await getAllPlaces();
    
    return allPlaces
      .map(place => ({
        ...place,
        distance: calculateDistance(
          latitude,
          longitude,
          place.latitude,
          place.longitude
        ),
      }))
      .filter(place => place.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error getting nearby places:', error);
    return [];
  }
};

