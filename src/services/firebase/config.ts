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

// Enable Firestore logging in development
if (import.meta.env.DEV) {
  console.log('[Firebase] Enabling detailed logging');
  window.localStorage.setItem('debug', '*');
}

// Detailed initialization logs
console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '[REDACTED]' });

// Initialize Firebase
let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

try {
  // Check if Firebase is already initialized
  try {
    app = initializeApp(firebaseConfig);
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      console.log('Firebase already initialized, getting existing app');
      app = initializeApp();
    } else {
      throw error;
    }
  }

  console.log('Firebase app initialized successfully');
  
  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Export Firebase services
export { auth, db, storage };

// Add initialization status check
export const isInitialized = () => {
  return app !== undefined && auth !== undefined;
};

// Log auth settings
console.log('Auth domain configured as:', auth.config.authDomain);
console.log('Current origin:', window.location.origin);

export default app;
