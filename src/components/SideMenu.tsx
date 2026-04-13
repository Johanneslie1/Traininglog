import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { useIsCoach, useIsAthlete } from '@/hooks/useUserRole';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToday: () => void;
  onOpenProfile: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onNavigateToday,
  onOpenProfile
}) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const isCoach = useIsCoach();
  const isAthlete = useIsAthlete();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-bg-secondary z-50 shadow-xl flex flex-col translate-x-0 transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary text-xl font-medium">GYM KEEPER</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <svg className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          <div className="space-y-1">
            <button onClick={onNavigateToday} className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Exercise Log
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/programs');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Programs
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/analytics');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14" />
              </svg>
              Analytics
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/wellness');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Wellness
            </button>
          </div>

          {/* Athlete Section - Only show for athletes */}
          {isAthlete && (
            <div className="pt-4 border-t border-[#3E4652] space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Athlete
              </div>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/teams');
                }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Teams
              </button>
            </div>
          )}

          {/* Coach Section - Only show for coaches */}
          {isCoach && (
            <div className="pt-4 border-t border-[#3E4652] space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Coach Tools
              </div>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/coach');
                }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Coach Hub
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-[#3E4652] space-y-1">
            <button
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1.724 1.724 0 013.35 0l.182.642a1.724 1.724 0 002.573 1.066l.58-.331a1.724 1.724 0 012.286.633l.334.578a1.724 1.724 0 01-.633 2.286l-.58.331a1.724 1.724 0 000 2.986l.58.331a1.724 1.724 0 01.633 2.286l-.334.578a1.724 1.724 0 01-2.286.633l-.58-.331a1.724 1.724 0 00-2.573 1.066l-.182.642a1.724 1.724 0 01-3.35 0l-.182-.642a1.724 1.724 0 00-2.573-1.066l-.58.331a1.724 1.724 0 01-2.286-.633l-.334-.578a1.724 1.724 0 01.633-2.286l.58-.331a1.724 1.724 0 000-2.986l-.58-.331a1.724 1.724 0 01-.633-2.286l.334-.578a1.724 1.724 0 012.286-.633l.58.331a1.724 1.724 0 002.573-1.066l.182-.642z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A11.958 11.958 0 0112 15.75c2.58 0 4.972.816 6.879 2.054M15 11.25a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profile
            </button>
          </div>

          {/* Auth Section for non-authenticated users */}
          {!isAuthenticated && (
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
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
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
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
    </>
  );
};

export default SideMenu;
