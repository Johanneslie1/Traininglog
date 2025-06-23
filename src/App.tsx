import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { HashRouter as Router } from 'react-router-dom';
import { store } from '@/store/store';
import AppRoutes from '@/routes';
import Layout from '@/components/layout/Layout';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { setUser, setLoading } from '@/features/auth/authSlice';
import { polyfill } from 'mobile-drag-drop';
import { UpdateNotification } from '@/components/common/UpdateNotification';
import 'mobile-drag-drop/default.css';
import '@/styles/dragAndDrop.css';

const App: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Handle auth initialization
  useEffect(() => {
    const initializeAuth = async () => {
      return new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
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
            } catch (error) {
              console.error('Error fetching user data:', error);
              setErrorMessage('Failed to fetch user data. Please try again later.');
            }
          } else {
            store.dispatch(setUser(null));
          }
          store.dispatch(setLoading(false));
          setIsAuthReady(true);
          resolve();
        });
      });
    };

    initializeAuth().catch(error => {
      console.error('Auth initialization error:', error);
      setErrorMessage('Failed to initialize authentication. Please try again later.');
      store.dispatch(setLoading(false));
      setIsAuthReady(true);
    });
  }, []);

  useEffect(() => {
    try {
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

      console.log('Setting auth loading state...');
      store.dispatch(setLoading(true));
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Auth state changed, user:', firebaseUser ? 'logged in' : 'logged out');
        try {
          if (firebaseUser) {
            console.log('Fetching additional user data for:', firebaseUser.uid);
            // Get additional user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              console.log('User document exists, setting user state');
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
              console.warn('User document not found in Firestore');
              store.dispatch(setUser(null));
            }
          } else {
            console.log('No user logged in, clearing user state');
            store.dispatch(setUser(null));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setErrorMessage('Failed to fetch user data. Please try again later.');
          store.dispatch(setUser(null));
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error initializing app:', error);
      setErrorMessage('Failed to initialize the app. Please try again later.');
    }
  }, []);
  if (errorMessage) {
    console.error('Displaying error message:', errorMessage);
    return (
      <div className="p-4 text-center bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
        <p className="mb-6 max-w-lg">{errorMessage}</p>
        <div className="bg-gray-800 p-4 rounded text-left mb-6 max-w-lg overflow-auto">
          <pre className="whitespace-pre-wrap">
            {`Path: ${window.location.pathname}
Origin: ${window.location.origin}
Host: ${window.location.host}`}
          </pre>
        </div>
        <button 
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          onClick={() => window.location.reload()}
        >
          Reload Application
        </button>
      </div>
    );
  }
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-[#1a1a1a] p-6 rounded-xl max-w-md w-full mx-4">
          <h1 className="text-white text-xl font-medium mb-4">Application Error</h1>
          <p className="text-gray-300 mb-6">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-[#8B5CF6] text-white py-3 rounded-lg hover:bg-[#7C3AED] transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <AppRoutes />
          <UpdateNotification />
        </Layout>
      </Router>
    </Provider>
  );
};

export default App;
