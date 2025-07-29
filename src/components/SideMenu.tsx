import React, { useState } from 'react';
import Settings from './Settings';
import SupersetGuide from './SupersetGuide';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  onExport: () => void;
  onShowWorkoutSummary: () => void;
  onNavigateToday: () => void;
  onNavigatePrograms: () => void;
  onNavigateExercises: () => void;
  onNavigateDashboard?: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onImport,
  onExport,
  onShowWorkoutSummary,
  onNavigateToday,
  onNavigatePrograms,
  onNavigateExercises,
  onNavigateDashboard
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showSupersetGuide, setShowSupersetGuide] = useState(false);

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
            {onNavigateDashboard && (
              <button onClick={onNavigateDashboard} className="w-full flex items-center gap-3 px-4 py-3 text-[#F2F3F7] hover:bg-[#2D3440] rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
            )}
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
