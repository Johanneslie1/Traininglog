/**
 * Custom hook for handling hardware back button on Android/mobile devices
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface UseBackButtonOptions {
  onBack?: () => void;
  preventDefaultOnRoot?: boolean;
}

export const useBackButton = (options: UseBackButtonOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onBack, preventDefaultOnRoot = true } = options;

  useEffect(() => {
    let lastBackPressAt = 0;

    const requestExit = () => {
      const now = Date.now();
      const shouldExit = now - lastBackPressAt < 1800;

      if (shouldExit) {
        window.history.back();
        return;
      }

      lastBackPressAt = now;
      toast('Press back again to exit', { icon: '↩️' });
      window.history.pushState(null, '', window.location.href);
    };

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
        requestExit();
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
    let lastBackPressAt = 0;

    const requestExit = () => {
      const now = Date.now();
      const shouldExit = now - lastBackPressAt < 1800;

      if (shouldExit) {
        if ((window as any).navigator?.app) {
          (window as any).navigator.app.exitApp();
          return;
        }
        window.history.back();
        return;
      }

      lastBackPressAt = now;
      toast('Press back again to exit', { icon: '↩️' });
      window.history.pushState(null, '', window.location.href);
    };

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
        console.log('[useAndroidBackButton] On root, requesting app exit confirmation');
        requestExit();
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
        requestExit();
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
