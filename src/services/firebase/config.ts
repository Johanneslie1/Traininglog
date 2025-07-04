import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Enable more detailed logs in development
if (import.meta.env.DEV) {
  console.log('Firebase in development mode');
}

const firebaseConfig = {
  apiKey: "AIzaSyDgA76WHz1JzwEc1YeazhKTUxqxHzhcP2c",
  authDomain: "session-logger-3619e.firebaseapp.com",
  projectId: "session-logger-3619e",
  storageBucket: "session-logger-3619e.firebasestorage.app",
  messagingSenderId: "936476651752",
  appId: "1:936476651752:web:7048bd9fcc902dc816595d",
  measurementId: "G-B6K0DDSVTH"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let initialized = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    initialized = true;
    console.log('Firebase app initialized successfully');
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    initialized = true;
    console.log('Using existing Firebase app');
  }

  if (import.meta.env.DEV) {
    console.log('Auth domain configured as:', auth.config.authDomain);
    console.log('Current origin:', window.location.origin);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  initialized = false;
}

export const isInitialized = () => initialized;
export { app, auth, db, storage };
