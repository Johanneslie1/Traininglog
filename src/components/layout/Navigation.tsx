import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    name: 'History',
    path: '/history',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: 'Programs',
    path: '/programs',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg-primary border-t border-border backdrop-blur-sm bg-opacity-90">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? 'text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
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
  );
};

export default Navigation;
