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
import { StatePersistence } from '@/utils/statePersistence';
import { ThemeProvider } from '@/context/ThemeContext';

import 'mobile-drag-drop/default.css';
import '@/styles/dragAndDrop.css';

// Initialize drag and drop polyfill
try {
  polyfill();
} catch (error) {
  console.warn('[DND] mobile-drag-drop polyfill failed to initialize:', error);
}

const AUTH_INIT_TIMEOUT_MS = 12000;

const App: React.FC = () => {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Initialize state persistence
  useEffect(() => {
    const cleanup = StatePersistence.initializeAutoSave();
    return cleanup;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    store.dispatch(setLoading(true));

    const timeoutId = window.setTimeout(() => {
      if (!isMounted) return;

      console.warn('[Auth] Initialization timeout reached, continuing with guest state');
      store.dispatch(setUser(null));
      store.dispatch(setLoading(false));
      setIsAuthInitialized(true);
    }, AUTH_INIT_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
        } else {
          store.dispatch(setUser(null));
        }
      } catch (error) {
        console.error('[Auth] Error handling auth state change:', error);
        store.dispatch(setUser(null));
      } finally {
        if (!isMounted) return;
        window.clearTimeout(timeoutId);
        store.dispatch(setLoading(false));
        setIsAuthInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  if (!isAuthInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100dvh',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        fontSize: '1.2em' 
      }}>
        Initializing...
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-bg-primary text-text-primary p-4">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-text-tertiary mb-4">Please refresh the page or try again later.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-secondary transition-colors"
        >
          Refresh Page
        </button>
      </div>
    }>
      <ThemeProvider>
        <Providers>
          <UpdateNotification />
          <Layout>
            <AppRoutes />
          </Layout>
        </Providers>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
