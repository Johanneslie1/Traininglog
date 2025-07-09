import React, { useState, useRef, useEffect } from 'react';
import { ExerciseSet } from '../types/sets';
import { ExerciseData } from '../services/exerciseDataService';
import { useSupersets } from '../context/SupersetContext';

interface ExerciseCardProps {
  exercise: ExerciseData;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  exerciseNumber?: number; // Add exercise number prop
  subNumber?: number; // Add sub-number for exercises within a superset
}

const getDifficultyColor = (difficulty?: string): string => {
  if (!difficulty) return 'var(--color-normal)';
  
  switch (difficulty) {
    case 'WARMUP': return 'var(--color-warmup)';
    case 'EASY': return 'var(--color-easy)';
    case 'MODERATE': return 'var(--color-moderate)';
    case 'HARD': return 'var(--color-hard)';
    default: return 'var(--color-moderate)';
  }
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  showActions = true,
  exerciseNumber,
  subNumber
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(true); // Add toggle state
  const menuRef = useRef<HTMLDivElement>(null);
  const { state, toggleExerciseSelection, isExerciseInSuperset, startCreating } = useSupersets();
  
  const isInSuperset = isExerciseInSuperset(exercise.id || '');
  const isSelected = state.selectedExercises.includes(exercise.id || '');
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleSupersetToggle = () => {
    if (exercise.id) {
      toggleExerciseSelection(exercise.id);
    }
  };

  // Calculate total volume for the exercise
  const calculateTotalVolume = () => {
    return exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  };

  // Toggle details display
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const cardClassName = `bg-[#1a1a1a] rounded-lg p-3 transition-all duration-200 ${
    isInSuperset 
      ? 'bg-[#2196F3]/5' 
      : isSelected 
      ? 'bg-[#8B5CF6]/10 border-l-2 border-[#8B5CF6]' 
      : 'hover:bg-black/20'
  }`;

  return (
    <div className={cardClassName}>
      {/* Removed standalone superset label - now handled in DraggableExerciseDisplay */}

      {/* Selection indicator during superset creation */}
      {state.isCreating && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSupersetToggle}
            className="w-4 h-4 text-[#8B5CF6] bg-gray-100 border-gray-300 rounded focus:ring-[#8B5CF6] focus:ring-2"
          />
          <span className="text-sm text-gray-400">Select for superset</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Compact exercise number with optional sub-number */}
          {exerciseNumber && (
            <div className="flex items-center justify-center min-w-6 h-6 bg-[#8B5CF6] text-white text-xs font-bold rounded-full px-1.5">
              {exerciseNumber}{subNumber ? String.fromCharCode(96 + subNumber) : ''}
            </div>
          )}
          <h3 className="text-base font-medium text-white">{exercise.exerciseName}</h3>
        </div>
        {showActions && (
          <div className="flex gap-2">
            {/* Toggle details button */}
            <button
              onClick={toggleDetails}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showDetails ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </button>
            
            {/* Unified superset button with different states */}
            <button
              onClick={() => {
                if (isInSuperset) return; // Already in a superset
                
                if (!state.isCreating) {
                  // Start superset creation mode
                  startCreating();
                  
                  // Auto-select this exercise
                  if (exercise.id) {
                    setTimeout(() => {
                      toggleExerciseSelection(exercise.id || '');
                    }, 50);
                  }
                } else {
                  // In creation mode - toggle selection
                  handleSupersetToggle();
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                isInSuperset 
                  ? 'bg-[#2196F3] text-white' // Blue for existing superset
                  : isSelected
                    ? 'bg-[#8B5CF6] text-white' // Purple for selected
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
              aria-label={isInSuperset ? "In superset" : isSelected ? "Selected for superset" : "Add to superset"}
            >
              {isInSuperset ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
                </svg>
              ) : isSelected ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
            
            {onEdit && (
              <button 
                onClick={onEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Edit exercise"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-500"
                aria-label="Delete exercise"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-3">
        {showDetails ? (
          // Detailed view - show all sets horizontally with color coding
          <div className="text-sm">
            <div className="flex flex-wrap items-center">
              {exercise.sets.map((set: ExerciseSet, index: number) => (
                <div key={index} className="flex items-center" style={{ marginRight: index === exercise.sets.length - 1 ? 0 : 8 }}>
                  <span 
                    className="font-medium whitespace-nowrap"
                    style={{ color: getDifficultyColor(set.difficulty) }}
                  >
                    {set.weight}kg {set.reps}r
                  </span>
                  {index < exercise.sets.length - 1 && (
                    <span className="text-gray-500 mx-1">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Summary view - show total sets and volume
          <div className="text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sets</span>
              <span className="text-white">{exercise.sets.length}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-400">Total Volume</span>
              <span className="text-white">{calculateTotalVolume()}kg</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;
