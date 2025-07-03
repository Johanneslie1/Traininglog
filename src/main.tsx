import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/theme.css'; // Import the new theme
import { isInitialized } from './services/firebase/config';

// Simple service worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered:', registration);
    }).catch(error => {
      console.log('SW registration failed:', error);
    });
  });
}

// Ensure Firebase is initialized before rendering
const renderApp = () => {
  if (!isInitialized()) {
    console.error('Firebase failed to initialize');
    // Retry initialization after a short delay
    setTimeout(renderApp, 1000);
    return;
  }

  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

renderApp();
