import React, { useState } from 'react';
import { useSupersets } from '../context/SupersetContext';

interface FloatingSupersetControlsProps {}

const FloatingSupersetControls: React.FC<FloatingSupersetControlsProps> = () => {
  const { 
    state, 
    cancelCreating, 
    createSuperset
  } = useSupersets();
  
  const [supersetName, setSupersetName] = useState('');
  const [isNaming, setIsNaming] = useState(false);
  
  if (!state.isCreating || state.selectedExercises.length === 0) {
    return null;
  }
  
  const handleCreateSuperset = () => {
    if (state.selectedExercises.length < 2) {
      alert('Please select at least 2 exercises to create a superset');
      return;
    }
    
    // If we're not in naming mode, show the input field
    if (!isNaming) {
      setIsNaming(true);
      return;
    }
    
    // Otherwise create the superset
    createSuperset(supersetName || undefined);
    setSupersetName('');
    setIsNaming(false);
  };
  
  const handleCancel = () => {
    if (isNaming) {
      setIsNaming(false);
      setSupersetName('');
    } else {
      cancelCreating();
    }
  };
  
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#1a1a1a] rounded-lg border border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20 p-4 w-11/12 max-w-md">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Create Superset</h3>
        <span className="text-sm bg-[#8B5CF6]/20 text-[#8B5CF6] px-2 py-1 rounded-full">
          {state.selectedExercises.length} selected
        </span>
      </div>

      {isNaming ? (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Superset name (optional)"
            value={supersetName}
            onChange={(e) => setSupersetName(e.target.value)}
            className="w-full px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-gray-600 focus:border-[#8B5CF6] focus:outline-none"
            maxLength={30}
            autoFocus
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-3">
          Select exercises and save to create a superset
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCreateSuperset}
          disabled={state.selectedExercises.length < 2}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isNaming ? 'Save Superset' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FloatingSupersetControls;
