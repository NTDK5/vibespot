import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";   // <-- FIXED IMPORT

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";r

import { auth, db } from "../firebase/config";

/**
 * Register a new user
 */
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: displayName || user.email.split("@")[0],
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Login with email/password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Google login placeholder
 */
export const signInWithGoogle = async () => {
  return {
    user: null,
    error: "Google Sign-In not implemented yet.",
  };
};

/**
 * Logout
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Fetch user role
 */
export const getUserRole = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) return docSnap.data().role || "user";
    return "user";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "user";
  }
};

/**
 * Check admin
 */
export const isAdmin = async (uid) => {
  const role = await getUserRole(uid);
  return role === "admin";
};

/**
 * Subscribe to auth state
 */
export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};
