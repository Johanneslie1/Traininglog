import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/services/firebase/auth';
import { logout } from '@/features/auth/authSlice';
import { RootState } from '@/store/store';
import Settings from './Settings';
import SupersetGuide from './SupersetGuide';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShowWorkoutSummary: () => void;
  onNavigateToday: () => void;
  onNavigatePrograms: () => void;
  onNavigateExercises: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onShowWorkoutSummary,
  onNavigateToday,
  onNavigatePrograms,
  onNavigateExercises
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showSupersetGuide, setShowSupersetGuide] = useState(false);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logout());
      onClose(); // Close the menu after logout
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#23272F] z-50 shadow-xl flex flex-col translate-x-0 transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-[#3E4652]">
          <div className="flex items-center justify-between">
            <h2 className="text-[#F2F3F7] text-xl font-medium">GYM KEEPER</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2D3440] rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <svg className="w-5 h-5 text-[#B0B8C1] hover:text-[#F2F3F7] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          <div className="space-y-1">
            <button onClick={onNavigateToday} className="w-full flex items-center gap-3 px-4 py-3 text-[#F2F3F7] hover:bg-[#2D3440] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Exercise Log
            </button>
            <button onClick={onNavigatePrograms} className="w-full flex items-center gap-3 px-4 py-3 text-[#F2F3F7] hover:bg-[#2D3440] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Programs
            </button>
            <button onClick={onNavigateExercises} className="w-full flex items-center gap-3 px-4 py-3 text-[#F2F3F7] hover:bg-[#2D3440] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Exercise Database
            </button>
          </div>

          {/* Data Management Section */}
          <div className="pt-4 border-t border-[#3E4652] space-y-1">
            <button
              onClick={onShowWorkoutSummary}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Workout Summary
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            <button
              onClick={() => setShowSupersetGuide(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Superset Guide
            </button>
          </div>

          {/* Profile Section */}
          {isAuthenticated && user && (
            <div className="pt-4 border-t border-[#3E4652] space-y-3">
              <div className="px-4 py-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-[#2D3440] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#F2F3F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#F2F3F7] text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[#B0B8C1] text-xs">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-[#2D3440] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Auth Section for non-authenticated users */}
          {!isAuthenticated && (
            <div className="pt-4 border-t border-[#3E4652] space-y-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F2F3F7] hover:bg-[#2D3440] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/register');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F2F3F7] hover:bg-[#2D3440] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Superset Guide Modal */}
      <SupersetGuide
        isOpen={showSupersetGuide}
        onClose={() => setShowSupersetGuide(false)}
      />
    </>
  );
};

export default SideMenu;
