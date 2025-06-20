import { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gymkeeper-dark">
      <Navigation />
      <main className="px-0 py-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
