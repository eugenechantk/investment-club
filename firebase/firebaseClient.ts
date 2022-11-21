// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from 'firebase/app'
import { getPerformance } from "firebase/performance";
import { getFirestore } from "firebase/firestore";
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/analytics'
import 'firebase/performance'
import { browserSessionPersistence, getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import * as firebase from 'firebase/app'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// async function setupEmulator(auth: Auth) {
//   const authUrl = "http://127.0.0.1:9099";
//   await fetch(authUrl);
//   connectAuthEmulator(firebaseClientAuth, authUrl);
// }

export const firebaseClient = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseClient);

// Initialize Firebase Authentication and get a reference to the service
export const firebaseClientAuth = getAuth(firebaseClient);
firebaseClientAuth.setPersistence(browserSessionPersistence);
// setupEmulator(firebaseClientAuth);