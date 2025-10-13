import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { ProgramsProvider } from '@/context/ProgramsContext';
import { Toaster } from 'react-hot-toast';
import { StatePersistence } from '@/utils/statePersistence';
import { useAndroidBackButton } from '@/hooks/useBackButton';

interface ProvidersProps {
  children: React.ReactNode;
}

// Component to handle navigation restoration and back button
const NavigationHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Restore saved navigation state on mount
  useEffect(() => {
    const savedState = StatePersistence.restoreState();
    if (savedState && savedState.currentPath) {
      const targetPath = savedState.currentPath.replace('#', '');
      if (targetPath !== location.pathname && targetPath !== '#/') {
        console.log('[NavigationHandler] Restoring navigation to:', targetPath);
        navigate(targetPath, { replace: true });
      }
    }
  }, []); // Only run once on mount

  // Handle Android/mobile back button
  useAndroidBackButton();

  // Save state on location change
  useEffect(() => {
    StatePersistence.saveState();
  }, [location]);

  return null;
};

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <HashRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <NavigationHandler />
        <ProgramsProvider>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 2000,
              style: {
                background: '#2a2a2a',
                color: '#fff',
              },
            }}
          />
        </ProgramsProvider>
      </HashRouter>
    </Provider>
  );
};
