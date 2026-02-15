import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { logger } from '../../utils/logger';

// Log the current origin - useful for debugging GitHub Pages
logger.info('Auth service initialized with origin:', window.location.origin);

let authInitialized = false;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'athlete' | 'coach';
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'athlete' | 'coach';
}

// Add a function to wait for auth to be ready
export const waitForAuth = (): Promise<void> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });
}

export interface LoginData {
  email: string;
  password: string;
}

// Helper function to convert Timestamp to Date
const convertTimestamps = (data: any): User => {
  return {
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
  };
};

export const registerUser = async (data: RegisterData): Promise<User> => {
  const { email, password, firstName, lastName, role } = data;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;

    const now = Timestamp.now();
    const userData = {
      id: uid,
      email,
      firstName,
      lastName,
      role,
      createdAt: now,
      updatedAt: now
    };

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', uid), userData);

    return convertTimestamps(userData);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginUser = async (data: LoginData): Promise<User> => {
  const { email, password } = data;

  try {
    logger.debug('Attempting to sign in with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    logger.debug('Sign in successful, fetching user data for uid:', uid);

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      logger.error('User document not found in Firestore after login');
      throw new Error('User data not found');
    }
    logger.debug('User data retrieved from Firestore');

    return convertTimestamps(userDoc.data() as User);
  } catch (error: any) {
    logger.error('Login error:', error);
    throw new Error(error.message);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const initializeAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = onAuthStateChanged(auth, () => {
        authInitialized = true;
        unsubscribe();
        resolve();
      }, (error) => {
        console.error('Auth initialization error:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Auth setup error:', error);
      reject(error);
    }
  });
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (!authInitialized) {
      await initializeAuth();
    }
    
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      logger.debug('No current user found');
      return null;
    }

    logger.debug('Fetching user data for:', firebaseUser.uid);
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      logger.warn('User document not found in Firestore');
      // Sign out the user if their document doesn't exist
      await signOut(auth);
      return null;
    }

    const userData = userDoc.data();
    logger.debug('User data retrieved successfully');
    
    return {
      id: firebaseUser.uid,
      email: userData.email || firebaseUser.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'athlete',
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    logger.error('Error getting user data:', error);
    // Don't throw, return null to allow the app to handle the error gracefully
    return null;
  }
};

/**
 * Update user's role in Firestore
 */
export const updateUserRole = async (userId: string, role: 'athlete' | 'coach'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      role,
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    logger.info('User role updated successfully:', { userId, role });
  } catch (error) {
    logger.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
};
