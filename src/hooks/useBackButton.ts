/**
 * Custom hook for handling hardware back button on Android/mobile devices
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseBackButtonOptions {
  onBack?: () => void;
  preventDefaultOnRoot?: boolean;
}

export const useBackButton = (options: UseBackButtonOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onBack, preventDefaultOnRoot = true } = options;

  useEffect(() => {
    const handlePopState = () => {
      // If custom back handler is provided, use it
      if (onBack) {
        onBack();
        window.history.pushState(null, '', window.location.href);
        return;
      }

      // Check if we're on the root path
      const isRoot = location.pathname === '/' || location.pathname === '';
      
      if (isRoot && preventDefaultOnRoot) {
        // On root, we could exit the app or show an exit confirmation
        const confirmExit = window.confirm('Do you want to exit the app?');
        if (confirmExit) {
          // In a PWA/mobile context, this might close the app
          window.history.back();
        } else {
          // Push the current state again to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      } else {
        // Navigate back normally
        navigate(-1);
      }
    };

    // Add initial state to enable back button handling
    window.history.pushState(null, '', window.location.href);
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, location, onBack, preventDefaultOnRoot]);
};

/**
 * Hook for Android hardware back button handling
 * This is specifically for mobile devices
 */
export const useAndroidBackButton = (callback?: () => boolean | void) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isHandlingBack = false;

    const handlePopState = () => {
      if (isHandlingBack) {
        return;
      }

      isHandlingBack = true;
      console.log('[useAndroidBackButton] Back button pressed, pathname:', location.pathname);
      
      // If callback is provided and returns true, prevent default behavior
      if (callback) {
        const result = callback();
        if (result === true) {
          console.log('[useAndroidBackButton] Callback prevented default');
          // Restore state to prevent navigation
          window.history.pushState(null, '', window.location.href);
          isHandlingBack = false;
          return;
        }
      }

      // Check if we're on the root path
      const isRoot = location.pathname === '/' || location.pathname === '';
      
      if (isRoot) {
        console.log('[useAndroidBackButton] On root, showing exit confirmation');
        const confirmExit = window.confirm('Do you want to exit the app?');
        if (!confirmExit) {
          // Prevent navigation by pushing state back
          window.history.pushState(null, '', window.location.href);
        } else {
          // Allow exit - don't prevent
          console.log('[useAndroidBackButton] User confirmed exit');
        }
      } else {
        // Navigate back in router (HashRouter will handle this)
        console.log('[useAndroidBackButton] Navigating back via router');
        // Let HashRouter handle the back navigation naturally
        // Don't call navigate(-1) as it's already handled by the browser
      }

      setTimeout(() => {
        isHandlingBack = false;
      }, 100);
    };

    // For native apps (Capacitor/Cordova)
    const handleBackButton = () => {
      console.log('[useAndroidBackButton] Native back button pressed');
      const isRoot = location.pathname === '/' || location.pathname === '';
      
      if (callback) {
        const result = callback();
        if (result === true) {
          return;
        }
      }

      if (isRoot) {
        const confirmExit = window.confirm('Do you want to exit the app?');
        if (confirmExit && (window as any).navigator?.app) {
          (window as any).navigator.app.exitApp();
        }
      } else {
        navigate(-1);
      }
    };

    // Add event listeners
    document.addEventListener('backbutton', handleBackButton, false);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('backbutton', handleBackButton, false);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [callback, navigate, location]);
};
