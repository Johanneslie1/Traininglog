import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './services/firebase/config'; // Ensure Firebase is initialized
import './styles/index.css';
import './styles/theme.css'; // Import the new theme
import './tests/authDebug'; // Add auth debugging tools for development
import './tests/permissionTest'; // Add permission testing tools

// Only register service worker in production to avoid caching dev modules
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
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
