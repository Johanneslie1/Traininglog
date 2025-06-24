import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ProgramsProvider } from '@/context/ProgramsContext';
import { HashRouter as Router } from 'react-router-dom';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <ProgramsProvider>
        <Router>
          {children}
        </Router>
      </ProgramsProvider>
    </Provider>
  );
};
