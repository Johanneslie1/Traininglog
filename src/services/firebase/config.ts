import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Detailed initialization logs
console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '[REDACTED]' });

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Get Firebase services - without persistence to simplify mobile support
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Add initialization status check
export const isInitialized = () => {
  return app !== undefined && auth !== undefined;
};

// Log auth settings
console.log('Auth domain configured as:', auth.config.authDomain);
console.log('Current origin:', window.location.origin);

export default app;
