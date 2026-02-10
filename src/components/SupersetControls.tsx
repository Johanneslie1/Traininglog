import React, { useState } from 'react';
import { useSupersets } from '../context/SupersetContext';

interface SupersetControlsProps {
  className?: string;
}

const SupersetControls: React.FC<SupersetControlsProps> = ({ className = '' }) => {
  const { 
    state, 
    startCreating, 
    cancelCreating, 
    createSuperset, 
    breakSuperset 
  } = useSupersets();
  
  const [supersetName, setSupersetName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleCreateSuperset = () => {
    if (state.selectedExercises.length < 2) {
      alert('Please select at least 2 exercises to create a superset');
      return;
    }
    
    if (showNameInput) {
      const newSuperset = createSuperset(supersetName || undefined);
      if (newSuperset) {
        setSupersetName('');
        setShowNameInput(false);
      }
    } else {
      setShowNameInput(true);
    }
  };

  const handleCancelNaming = () => {
    setSupersetName('');
    setShowNameInput(false);
  };

  if (!state.isCreating && state.supersets.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={startCreating}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-text-primary rounded-lg hover:bg-accent-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
          </svg>
          Create Superset
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Superset Creation Controls */}
      {state.isCreating && (
        <div className="bg-bg-secondary border border-accent-primary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-text-primary">Create Superset</h3>
            <span className="text-sm text-gray-400">
              {state.selectedExercises.length} exercise{state.selectedExercises.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <p className="text-sm text-gray-400 mb-4">
            Select 2 or more exercises to group them as a superset. 
            You'll perform them back-to-back with minimal rest.
          </p>

          {showNameInput && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Superset name (optional)"
                value={supersetName}
                onChange={(e) => setSupersetName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:outline-none"
                maxLength={30}
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreateSuperset}
              disabled={state.selectedExercises.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-text-primary rounded-lg hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showNameInput ? 'Create' : 'Next'}
            </button>
            <button
              onClick={showNameInput ? handleCancelNaming : cancelCreating}
              className="px-4 py-2 bg-gray-600 text-text-primary rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showNameInput ? 'Back' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Supersets */}
      {state.supersets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-primary">Active Supersets</h3>
          {state.supersets.map((superset) => (
            <div key={superset.id} className="bg-bg-secondary border border-[#2196F3] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-text-primary font-medium">{superset.name}</span>
                </div>
                <button
                  onClick={() => breakSuperset(superset.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Break superset"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {superset.exerciseIds.length} exercises grouped
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add more supersets button */}
      {!state.isCreating && state.supersets.length > 0 && (
        <button
          onClick={startCreating}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-text-primary rounded-lg hover:bg-accent-secondary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Another Superset
        </button>
      )}
    </div>
  );
};

export default SupersetControls;
