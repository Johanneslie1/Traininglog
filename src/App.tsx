import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { setUser, setLoading } from '@/features/auth/authSlice';
import { polyfill } from 'mobile-drag-drop';
import { UpdateNotification } from '@/components/common/UpdateNotification';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

const App: React.FC = () => {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing auth state...');
    store.dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] Auth state changed:', user?.uid);
      try {
        if (user) {
          // Check if user document exists
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : { email: user.email };
          
          // Dispatch user data to Redux
          store.dispatch(setUser({
            id: user.uid,
            email: user.email || userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            role: userData.role || 'athlete',
            createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
            updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date()
          }));
          console.log('[Auth] User authenticated:', user.uid);
        } else {
          store.dispatch(setUser(null));
          console.log('[Auth] No user authenticated');
        }
      } catch (error) {
        console.error('[Auth] Error handling auth state change:', error);
        store.dispatch(setUser(null));
      } finally {
        store.dispatch(setLoading(false));
        setIsAuthInitialized(true);
      }
    });

    return () => {
      console.log('[Auth] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  if (!isAuthInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2em' 
      }}>
        Initializing...
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-4">Please refresh the page or try again later.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    }>
      <Providers>
        <UpdateNotification />
        <Layout>
          <AppRoutes />
        </Layout>
      </Providers>
    </ErrorBoundary>
  );
};

export default App;
