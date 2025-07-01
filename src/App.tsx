import React from 'react';
import { polyfill } from 'mobile-drag-drop';
import { UpdateNotification } from '@/components/common/UpdateNotification';
import { Providers } from '@/providers';
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
  // No authentication needed, just render the app
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

