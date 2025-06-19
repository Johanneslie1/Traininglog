import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from '@/store/store';
import AppRoutes from '@/routes';
import Layout from '@/components/layout/Layout';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { setUser, setLoading } from '@/features/auth/authSlice';
import { polyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';
import '@/styles/dragAndDrop.css';

const App: React.FC = () => {  useEffect(() => {
    // Initialize the mobile drag and drop polyfill with enhanced options
    const polyfillResult = polyfill({
      // Use this to make the drag image appear at a more natural position
      dragImageTranslateOverride: () => {
        // Simplified positioning that works well on mobile
        return {
          x: -10,
          y: -10
        };
      },
      // Enable long press for better mobile drag initiation
      holdToDrag: 300, // Hold for 300ms to start dragging
      // Force to scroll while dragging to enable scrolling during drag operations
      forceApply: true
    });
    
    if (polyfillResult) {
      console.log('Mobile drag and drop polyfill applied successfully');
    }
    
    // Prevent auto-scrolling and enable manual scrolling during drag operations
    window.addEventListener('touchmove', function(e) {
      const dragElement = document.querySelector('.is-dragging');
      if (dragElement) {
        // Allow scrolling during drag
        e.stopPropagation();
      }
    }, { passive: false });

    store.dispatch(setLoading(true));
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            store.dispatch(setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              role: userData.role || 'athlete',
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            }));
          } else {
            store.dispatch(setUser(null));
          }
        } else {
          store.dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        store.dispatch(setUser(null));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </Provider>
  );
};

export default App;
