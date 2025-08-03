import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreateExerciseDialog } from '../../components/exercises/CreateExerciseDialog';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    name: 'Today',
    path: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    name: 'Programs',
    path: '/programs',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    name: 'Exercises',
    path: '/exercises',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    name: 'History',
    path: '/history',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: 'More',
    path: '#',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )
  }
];

const Navigation: React.FC = () => {  
  const navigate = useNavigate();
  const location = useLocation();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleNavigate = (path: string) => {
    if (path === '#') {
      setShowDrawer(true);
      return;
    }
    console.log('Navigating to:', path);
    navigate(path);
    setShowDrawer(false); // Close drawer after navigation
  };

  const handleCreateExercise = () => {
    setShowDrawer(false);
    setShowCreateDialog(true);
  };

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg-primary border-t border-border backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                    isActive ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    {item.icon}
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-accent-primary" />
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Drawer Menu */}
      {showDrawer && (
        <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowDrawer(false)}>
          <div 
            className="absolute bottom-0 inset-x-0 bg-[#1a1a1a] rounded-t-xl py-6 px-4 space-y-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            
            <button
              onClick={handleCreateExercise}
              className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-white/5 text-white"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Create Exercise
            </button>

            <button
              onClick={() => handleNavigate('/profile')}
              className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-white/5 text-white"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile & Settings
            </button>
          </div>
        </div>
      )}

      {/* Create Exercise Dialog */}
      {showCreateDialog && (
        <CreateExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(_id) => {
            setShowCreateDialog(false);
            // Optionally navigate to the exercise or show a success message
          }}
        />
      )}
    </>
  );
};

export default Navigation;
