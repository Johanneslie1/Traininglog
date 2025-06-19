import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';

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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return convertTimestamps(userDoc.data() as User);
  } catch (error: any) {
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

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        unsubscribe();
        if (!user) {
          resolve(null);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            resolve(null);
            return;
          }

          resolve(userDoc.data() as User);
        } catch (error) {
          reject(error);
        }
      },
      reject
    );
  });
};
