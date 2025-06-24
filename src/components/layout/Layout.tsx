import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SideMenu from '../SideMenu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine if we're on a page that should have a different background
  const isDarkBackground = ['/'].includes(location.pathname);
  const handleExport = () => {
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    // TODO: Implement import functionality
  };

  const handleShowWorkoutSummary = () => {
    // TODO: Implement workout summary functionality
  };
  const handleNavigate = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
    setShowMenu(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkBackground ? 'bg-bg-primary' : 'bg-bg-secondary'
    }`}>
      {/* Menu Button */}
      <button
        onClick={() => setShowMenu(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-full bg-bg-primary hover:bg-bg-secondary shadow-lg"
        aria-label="Open Menu"
      >
        <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="container mx-auto px-4 py-6 pb-20">
          {children}
        </div>
      </main>

      {/* Side Menu - Always rendered but conditionally visible */}
      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onImport={handleImport}
        onExport={handleExport}
        onShowWorkoutSummary={handleShowWorkoutSummary}        onNavigateToday={() => handleNavigate('/')}
        onNavigateProfile={() => handleNavigate('/profile')}
        onNavigateHistory={() => handleNavigate('/history')}
        onNavigatePrograms={() => handleNavigate('/programs')}
      />
    </div>
  );
};

export default Layout;
