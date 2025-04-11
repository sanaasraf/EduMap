// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYh4wWfsLNwf-QVbuo_CbudDkV3Ix1PLo",
  authDomain: "edumap-b3835.firebaseapp.com",
  projectId: "edumap-b3835",
  storageBucket: "edumap-b3835.firebasestorage.app",
  messagingSenderId: "350998479665",
  appId: "1:350998479665:web:16f29952fbd249fb59e610",
  measurementId: "G-95ZW7EKV3R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services: Authentication, Storage, and Firestore Database
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
