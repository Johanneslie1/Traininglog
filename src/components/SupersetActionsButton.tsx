import React, { useState, useEffect } from 'react';
import { useSupersets } from '../context/SupersetContext';
import { buildSupersetDisplayTitle, buildSupersetLabels } from '@/utils/supersetUtils';

interface SupersetActionsButtonProps {
  exerciseId: string;
}

const SupersetActionsButton: React.FC<SupersetActionsButtonProps> = ({ exerciseId }) => {
  const { 
    state,
    getSupersetByExercise,
    breakSuperset
  } = useSupersets();
  
  const [showActions, setShowActions] = useState(false);
  
  const superset = getSupersetByExercise(exerciseId);
  const isInSuperset = !!superset;

  const labelsByExerciseId = React.useMemo(() => {
    const flattenedExerciseOrder = state.supersets.flatMap((group) => group.exerciseIds);
    return buildSupersetLabels(state.supersets, flattenedExerciseOrder);
  }, [state.supersets]);

  const handleBreakSuperset = () => {
    if (superset) {
      breakSuperset(superset.id);
      setShowActions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showActions) {
        setShowActions(false);
      }
    };
    
    if (showActions) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showActions]);

  if (!isInSuperset) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-500 bg-blue-500/10 rounded-full hover:bg-blue-500/20 transition-colors"
        aria-label="Superset Actions"
      >
        <span>{superset ? buildSupersetDisplayTitle(superset, labelsByExerciseId) : 'Superset'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showActions && (
        <div className="absolute z-20 mt-1 right-0 bg-bg-secondary border border-border rounded-lg shadow-xl p-2 min-w-[180px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBreakSuperset();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-text-primary hover:bg-white/10 rounded transition-colors text-left"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Break Superset
          </button>
        </div>
      )}
    </div>
  );
};

export default SupersetActionsButton;
