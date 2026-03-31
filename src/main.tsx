import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './services/firebase/config'; // Ensure Firebase is initialized
import './styles/index.css';
import './styles/theme.css'; // Import the new theme

const CHUNK_RELOAD_GUARD_KEY = 'chunk-reload-attempted';

const tryRecoverFromStaleChunk = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason ?? '');
  const isChunkError =
    /ChunkLoadError/i.test(message) ||
    /dynamically imported module/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message);

  if (!isChunkError) return;

  // Avoid infinite reload loops if the problem is persistent.
  if (sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1') return;

  sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
  window.location.reload();
};

window.addEventListener('error', (event) => {
  tryRecoverFromStaleChunk((event as ErrorEvent).error);
});

window.addEventListener('unhandledrejection', (event) => {
  tryRecoverFromStaleChunk((event as PromiseRejectionEvent).reason);
});

// Debug helpers should never be loaded in production bundles.
if (import.meta.env.DEV) {
  void import('./tests/authDebug');
  void import('./tests/permissionTest');
}

// Only register service worker in production to avoid caching dev modules
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(registration => {
      console.log('SW registered:', registration);
    }).catch(error => {
      console.log('SW registration failed:', error);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
