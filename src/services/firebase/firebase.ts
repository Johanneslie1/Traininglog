import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, query, where, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const productionFirebaseConfig = {
  apiKey: 'AIzaSyDgA76WHz1JzwEc1YeazhKTUxqxHzhcP2c',
  authDomain: 'session-logger-3619e.firebaseapp.com',
  projectId: 'session-logger-3619e',
  storageBucket: 'session-logger-3619e.firebasestorage.app',
  messagingSenderId: '936476651752',
  appId: '1:936476651752:web:7048bd9fcc902dc816595d',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || productionFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || productionFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || productionFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || productionFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || productionFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || productionFirebaseConfig.appId,
};

// Ensure Firebase is only initialized once (singleton pattern)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Expose Firebase instances on window in development for browser-console utility scripts
if (import.meta.env.DEV) {
  const _w = window as unknown as Record<string, unknown>;
  _w.__firebaseDb = db;
  _w.__firebaseAuth = auth;
  // Firestore functions — must come from the same SDK instance as db
  _w.__firestoreCollection = collection;
  _w.__firestoreDoc = doc;
  _w.__firestoreGetDocs = getDocs;
  _w.__firestoreGetDoc = getDoc;
  _w.__firestoreQuery = query;
  _w.__firestoreWhere = where;
  _w.__firestoreSetDoc = setDoc;
  _w.__firestoreWriteBatch = writeBatch;
  _w.__firestoreTimestamp = Timestamp;
}
