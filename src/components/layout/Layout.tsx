import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useDate } from '@/context/DateContext';
import SideMenu from '../SideMenu';
import WeeklyCalendarHeader from '../WeeklyCalendarHeader';
import Calendar from '../Calendar';
import AppOverlay from '@/components/ui/AppOverlay';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { selectedDate, setSelectedDate } = useDate();
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const isDarkBackground = ['/'].includes(location.pathname);
  
  // Hide Layout's fixed elements on program routes (they have their own headers)
  const isProgramRoute = location.pathname.startsWith('/programs') || location.pathname === '/program-selection';
  
  // Only show calendar controls on Exercise Log route
  const showWeeklyCalendar = isAuthenticated && 
    !isProgramRoute && 
    location.pathname === '/';

  // Keep side menu accessible when weekly header is hidden
  const showFallbackMenuButton = isAuthenticated && !showWeeklyCalendar;
  
  // Navigation handlers
  const handleNavigate = (path: string) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col ${
      isDarkBackground ? 'bg-bg-primary' : 'bg-bg-secondary'
    }`}>
      {/* Weekly Calendar Header - Only show on specific routes */}
      {showWeeklyCalendar && (
        <WeeklyCalendarHeader
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onCalendarIconClick={() => setShowMonthlyCalendar(true)}
          onMenuClick={() => setShowMenu(true)}
        />
      )}

      {/* Fallback menu button for all authenticated routes without weekly header */}
      {showFallbackMenuButton && (
        <button
          onClick={() => setShowMenu(true)}
          className="fixed top-4 left-4 z-40 p-2 bg-bg-secondary border border-border hover:bg-bg-tertiary rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <main className="flex-1 relative pb-app-content">
        {isProgramRoute ? (
          // Program routes handle their own layout (full-screen)
          children
        ) : (
          // Regular routes use container
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        )}
      </main>

      {/* Side Menu - Only render when authenticated */}
      {isAuthenticated && (
        <SideMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onNavigateToday={() => handleNavigate('/')}
          onOpenProfile={() => handleNavigate('/profile')}
        />
      )}

      {/* Monthly Calendar Modal */}
      {showWeeklyCalendar && showMonthlyCalendar && (
        <AppOverlay
          isOpen={showMonthlyCalendar}
          onClose={() => setShowMonthlyCalendar(false)}
          className="z-[70] flex items-center justify-center p-4"
          ariaLabel="Monthly calendar"
        >
          <div className="relative max-w-2xl w-full" onMouseDown={(event) => event.stopPropagation()}>
            <button
              onClick={() => setShowMonthlyCalendar(false)}
              className="absolute -top-4 -right-4 z-10 p-2 bg-bg-secondary hover:bg-bg-tertiary rounded-full shadow-lg transition-colors"
              aria-label="Close calendar"
            >
              <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Calendar
              selectedDate={selectedDate}
              onDayClick={(date) => {
                setSelectedDate(date);
                setShowMonthlyCalendar(false);
              }}
            />
          </div>
        </AppOverlay>
      )}
    </div>
  );
};

export default Layout;
