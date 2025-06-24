import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { setUser, setLoading } from '@/features/auth/authSlice';
import { polyfill } from 'mobile-drag-drop';
import { UpdateNotification } from '@/components/common/UpdateNotification';
import { Providers } from '@/providers';
import { store } from '@/store/store';
import Layout from '@/components/layout/Layout';
import AppRoutes from '@/routes';
import 'mobile-drag-drop/default.css';
import '@/styles/dragAndDrop.css';

// Initialize drag and drop polyfill
polyfill();

const AppContent: React.FC = () => {
  console.log('AppContent rendering');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize auth state
  useEffect(() => {
    console.log('AppContent mounted');
    store.dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user?.uid);
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            store.dispatch(setUser({
              id: user.uid,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              createdAt: userData.createdAt.toDate(),
              updatedAt: userData.updatedAt.toDate()
            }));
          }
        } else {
          store.dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorMessage('Failed to fetch user data. Please try again later.');
      } finally {
        store.dispatch(setLoading(false));
        setIsAuthReady(true);
      }
    });

    return () => {
      console.log('AppContent unmounting');
      unsubscribe();
    };
  }, []);

  if (!isAuthReady) {
    console.log('Auth not ready');
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="app h-full">
      <UpdateNotification />
      <Layout>
        <AppRoutes />
      </Layout>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App rendering');
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
};

export default App;
