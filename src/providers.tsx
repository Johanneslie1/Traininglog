import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { HashRouter } from 'react-router-dom';
import { ProgramsProvider } from '@/context/ProgramsContext';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <HashRouter>
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
