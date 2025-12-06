const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function: Set User Role (Custom Claims)
 *
 * This function sets custom claims on the user's auth token based on their role in Firestore.
 * Call this after creating/updating a user document in Firestore.
 *
 * Usage:
 * POST https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/setUserRole
 * Body: { "uid": "user_id_here" }
 */
exports.setUserRole = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {uid} = req.body;

    if (!uid) {
      res.status(400).json({error: "uid is required"});
      return;
    }

    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({error: "User not found"});
      return;
    }

    const userData = userDoc.data();
    const role = userData.role || "user";

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: role,
    });

    res.status(200).json({
      success: true,
      uid: uid,
      role: role,
    });
  } catch (error) {
    console.error("Error setting user role:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * Cloud Function: Recalculate Spot Rating
 *
 * This function recalculates the average rating and review count for a spot
 * whenever a review is created, updated, or deleted.
 *
 * Usage:
 * POST https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/recalculateRating
 * Body: { "spotId": "spot_id_here" }
 */
exports.recalculateRating = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {spotId} = req.body;

    if (!spotId) {
      res.status(400).json({error: "spotId is required"});
      return;
    }

    // Get all reviews for this spot
    const reviewsSnapshot = await db
      .collection("reviews")
      .where("spotId", "==", spotId)
      .get();

    if (reviewsSnapshot.empty) {
      // No reviews, set rating to 0
      await db.collection("spots").doc(spotId).update({
        averageRating: 0,
        reviewCount: 0,
      });

      res.status(200).json({
        success: true,
        spotId: spotId,
        averageRating: 0,
        reviewCount: 0,
      });
      return;
    }

    // Calculate average rating
    let totalRating = 0;
    let reviewCount = 0;

    reviewsSnapshot.forEach((doc) => {
      const review = doc.data();
      totalRating += review.rating || 0;
      reviewCount += 1;
    });

    const averageRating = totalRating / reviewCount;

    // Update spot document
    await db.collection("spots").doc(spotId).update({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviewCount,
    });

    res.status(200).json({
      success: true,
      spotId: spotId,
      averageRating: averageRating,
      reviewCount: reviewCount,
    });
  } catch (error) {
    console.error("Error recalculating rating:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * Cloud Function: Trigger on Review Create/Update/Delete (Alternative approach)
 *
 * This is an alternative approach using Firestore triggers.
 * Uncomment and use this if you prefer automatic triggers over HTTP calls.
 */
/*
exports.onReviewChange = functions.firestore
  .document('reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const reviewData = change.after.exists ? change.after.data() : change.before.data();
    const spotId = reviewData?.spotId;

    if (!spotId) {
      console.error('No spotId found in review');
      return;
    }

    // Recalculate rating
    const reviewsSnapshot = await db
      .collection('reviews')
      .where('spotId', '==', spotId)
      .get();

    if (reviewsSnapshot.empty) {
      await db.collection('spots').doc(spotId).update({
        averageRating: 0,
        reviewCount: 0,
      });
      return;
    }

    let totalRating = 0;
    let reviewCount = 0;

    reviewsSnapshot.forEach((doc) => {
      const review = doc.data();
      totalRating += review.rating || 0;
      reviewCount += 1;
    });

    const averageRating = totalRating / reviewCount;

    await db.collection('spots').doc(spotId).update({
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviewCount,
    });
  });
*/

/**
 * Optional: Generate Thumbnails
 *
 * This function generates thumbnails for uploaded images.
 * Requires additional setup with sharp or imagemagick.
 */
/*
exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process images
    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }

    // Skip if already a thumbnail
    if (filePath.includes('thumb_')) {
      return null;
    }

    // Generate thumbnail logic here
    // This requires additional image processing libraries

    return null;
  });
*/

