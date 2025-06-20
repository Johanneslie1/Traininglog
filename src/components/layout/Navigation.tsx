import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  name: string;
  icon: JSX.Element;
  color: string;
  path: string;
}

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const menuItems: MenuItem[] = [
    {
      name: "Exercise Log",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M3 14h18m-9-4v10m-7-4h14" />
        </svg>
      ),
      color: "text-primary-400",
      path: "/"
    },
    {
      name: "Exercise History",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-primary-300",
      path: "/history"
    },
    {
      name: "Programs",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5v2h6V5" />
        </svg>
      ),
      color: "text-primary-500",
      path: "/programs"
    },
    {
      name: "Export & Import",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      color: "text-primary-200",
      path: "/backup"
    }
  ];

  const navigateTo = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };  return (
    <>
      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40" onClick={toggleMenu}>
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-gymkeeper-dark shadow-lg z-50" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="p-6 bg-purple-gradient border-b border-gymkeeper-purple-darker">
                <h1 className="text-3xl font-bold text-white mb-1">GYM KEEPER</h1>
                <p className="text-gray-200 text-sm">v1.0.0</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pt-4">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    className="flex items-center w-full px-6 py-5 hover:bg-gymkeeper-light"
                    onClick={() => navigateTo(item.path)}
                  >
                    <span className={`mr-4 ${item.color}`}>{item.icon}</span>
                    <span className="text-white text-xl">{item.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="p-4 border-t border-gymkeeper-purple-darker">
                <div className="text-xs text-gray-400">© 2025 GYM KEEPER</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
