import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { HashRouter as Router } from 'react-router-dom';
import { ProgramsProvider } from '@/context/ProgramsContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <Router>
        <ProgramsProvider>
          {children}
        </ProgramsProvider>
      </Router>
    </Provider>
  );
};
