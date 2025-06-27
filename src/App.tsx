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

// Register service worker only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, trigger app update
                window.dispatchEvent(new CustomEvent('swUpdated'));
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });

  // Handle controller change only in production
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing && import.meta.env.PROD) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Handle service worker messages
navigator.serviceWorker?.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Handle cache updates
    console.log('Cache updated:', event.data.url);
  }
});

const AppContent: React.FC = () => {
  console.log('AppContent rendering');  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize auth state
  useEffect(() => {
    console.log('AppContent mounted');
    store.dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user?.uid);      try {
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
        store.dispatch(setUser(null)); // Reset user state on error
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent mb-4"></div>
        <p className="text-text-secondary">Loading app...</p>
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

// Remove this unused function, and instead define setErrorMessage as a state setter in AppContent

