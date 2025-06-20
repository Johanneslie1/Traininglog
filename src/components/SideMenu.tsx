import React from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  onExport: () => void;
  onShowWorkoutSummary: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onImport,
  onExport,
  onShowWorkoutSummary
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-[#1a1a1a] z-50 shadow-lg">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white text-xl font-medium">Menu</h2>
        </div>
        
        <div className="p-2">
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#2a2a2a] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Workout Data
          </button>
          
          <button
            onClick={onImport}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#2a2a2a] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Workout Data
          </button>
          
          <button
            onClick={onShowWorkoutSummary}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#2a2a2a] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Workout Summary
          </button>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
