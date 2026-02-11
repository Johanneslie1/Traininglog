import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useDate } from '@/context/DateContext';
import SideMenu from '../SideMenu';
import Settings from '../Settings';
import WeeklyCalendarHeader from '../WeeklyCalendarHeader';
import Calendar from '../Calendar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { selectedDate, setSelectedDate } = useDate();
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const isDarkBackground = ['/'].includes(location.pathname);
  
  // Hide Layout's fixed elements on program routes (they have their own headers)
  const isProgramRoute = location.pathname.startsWith('/programs') || location.pathname === '/program-selection';
  
  // Only show weekly calendar on specific routes
  const showWeeklyCalendar = isAuthenticated && 
    !isProgramRoute && 
    (location.pathname === '/' || location.pathname === '/exercises');
  
  // Navigation handlers
  const handleNavigate = (path: string) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <div className={`min-h-screen flex flex-col ${
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

      {/* Main Content */}
      <main className="flex-1 relative">
        {isProgramRoute ? (
          // Program routes handle their own layout (full-screen)
          children
        ) : (
          // Regular routes use container
          <div className="container mx-auto px-4 py-6 pb-20">
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
          onNavigatePrograms={() => handleNavigate('/programs')}
          onOpenSettings={() => {
            setShowMenu(false);
            setShowSettings(true);
          }}
        />
      )}

      {/* Settings Modal - Rendered at layout level, independent of SideMenu */}
      {isAuthenticated && (
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Monthly Calendar Modal */}
      {showMonthlyCalendar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
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
        </div>
      )}
    </div>
  );
};

export default Layout;
