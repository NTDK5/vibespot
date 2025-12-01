
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
//@ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBMcB9MnzvIZ2hpb6ki6BqJwpsPVQnO8-k",
  authDomain: "vibespot-28e94.firebaseapp.com",
  projectId: "vibespot-28e94",
  storageBucket: "vibespot-28e94.firebasestorage.app",
  messagingSenderId: "421728334376",
  appId: "1:421728334376:web:69b49a8da6e426cddb3b1d",
  measurementId: "G-4E1QW512KG"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
