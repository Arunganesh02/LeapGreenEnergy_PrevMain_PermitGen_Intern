import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7iTL9pTQp_b4VoyGJkTzueWGk1Ke3BuM",
  authDomain: "leapgreen-268cf.firebaseapp.com",
  projectId: "leapgreen-268cf",
  storageBucket: "leapgreen-268cf.firebasestorage.app",
  messagingSenderId: "286772429161",
  appId: "1:286772429161:web:a2e8c8470314765cf2fdf8",
  measurementId: "G-T1H4YQHQXD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth with persistence using AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});


// Export the initialized services for use in your application
export { db, auth };
