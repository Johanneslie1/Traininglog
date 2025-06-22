import React, { useState } from 'react';
import Settings from './Settings';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  onExport: () => void;
  onShowWorkoutSummary: () => void;
  onNavigateToday: () => void;
  onNavigateProfile: () => void;
  onNavigateHistory: () => void;
  onNavigatePrograms: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onImport,
  onExport,
  onShowWorkoutSummary,
  onNavigateToday,
  onNavigateProfile,
  onNavigateHistory,
  onNavigatePrograms
}) => {
  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-bg-primary z-50 shadow-lg flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary text-xl font-medium">GYM KEEPER</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          <div className="space-y-1">
            <button
              onClick={onNavigateToday}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Today
            </button>
            
            <button
              onClick={onNavigateHistory}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
            
            <button
              onClick={onNavigatePrograms}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Programs
            </button>

            <button
              onClick={onNavigateProfile}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>

          {/* Data Management Section */}
          <div className="pt-4 border-t border-border space-y-1">
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
              onClick={onExport}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </button>
            
            <button
              onClick={onImport}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Data
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
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default SideMenu;
