import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import SideMenu from '../SideMenu';
import AuthButtons from '../AuthButtons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [hasModals, setHasModals] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const isDarkBackground = ['/'].includes(location.pathname);
  
  // Check for modals in the DOM
  useEffect(() => {
    const checkForModals = () => {
      // Check if there are any full-screen fixed elements (modals)
      const fixedElements = document.querySelectorAll('.fixed');
      let hasModal = false;
      
      fixedElements.forEach(element => {
        const classes = element.className;
        // Check if element has both 'fixed' and 'inset-0' classes (full-screen modal indicator)
        if (classes.includes('fixed') && classes.includes('inset-0')) {
          // Exclude the menu button itself and auth buttons
          if (!element.getAttribute('aria-label')?.includes('Menu') && 
              !element.closest('[class*="auth-buttons"]')) {
            hasModal = true;
          }
        }
      });
      
      setHasModals(hasModal);
    };
    
    // Check immediately and set up observer
    checkForModals();
    
    // Use RAF for smoother updates
    let rafId: number;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkForModals);
    });
    
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);
  
  const handleShowWorkoutSummary = () => {
    // TODO: Implement workout summary functionality
  };

  // Navigation handlers
  const handleNavigate = (path: string) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkBackground ? 'bg-bg-primary' : 'bg-bg-secondary'
    }`}>
      {/* Menu Button - Only show when authenticated and no modals are open */}
      {isAuthenticated && !hasModals && (
        <button
          onClick={() => setShowMenu(true)}
          className="fixed top-4 left-4 z-10 p-2 rounded-full bg-bg-primary hover:bg-bg-secondary shadow-lg"
          aria-label="Open Menu"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Auth Buttons */}
      <div className={`fixed top-4 z-30 ${isAuthenticated ? 'right-4' : 'left-1/2 transform -translate-x-1/2'}`}>
        <AuthButtons />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="container mx-auto px-4 py-6 pb-20">
          {children}
        </div>
      </main>

      {/* Side Menu - Only render when authenticated */}
      {isAuthenticated && (
        <SideMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onShowWorkoutSummary={handleShowWorkoutSummary}
          onNavigateToday={() => handleNavigate('/')}
          onNavigatePrograms={() => handleNavigate('/programs')}
          onNavigateExercises={() => handleNavigate('/exercises?showCreate=true')}
        />
      )}
    </div>
  );
};

export default Layout;
