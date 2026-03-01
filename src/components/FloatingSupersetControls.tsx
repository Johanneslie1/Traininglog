import React from 'react';
import { useSupersets } from '../context/SupersetContext';

interface FloatingSupersetControlsProps {}

const FloatingSupersetControls: React.FC<FloatingSupersetControlsProps> = () => {
  const { 
    state, 
    cancelCreating, 
    createSuperset
  } = useSupersets();
  
  if (!state.isCreating || state.selectedExercises.length === 0) {
    return null;
  }
  
  const handleCreateSuperset = () => {
    if (state.selectedExercises.length < 2) {
      alert('Please select at least 2 exercises to create a superset');
      return;
    }

    createSuperset();
  };
  
  const handleCancel = () => {
    cancelCreating();
  };
  
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-bg-secondary rounded-lg border border-accent-primary shadow-lg shadow-[#8B5CF6]/20 p-4 w-11/12 max-w-md">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-text-primary">Create Superset</h3>
        <span className="text-sm bg-accent-primary/20 text-[#8B5CF6] px-2 py-1 rounded-full">
          {state.selectedExercises.length} selected
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-3">
        Select exercises and save to create a superset
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleCreateSuperset}
          disabled={state.selectedExercises.length < 2}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-text-primary rounded-lg hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary hover:opacity-90 transition-colors"
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
