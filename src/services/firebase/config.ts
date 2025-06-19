import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

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
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable Auth persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error enabling auth persistence:', error);
});

// Enable Firestore offline persistence
enableMultiTabIndexedDbPersistence(db).catch((error) => {
  console.error('Error enabling Firestore persistence:', error);
});

export default app;
