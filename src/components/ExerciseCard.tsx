import React, { useState, useRef, useEffect } from 'react';
import { ExerciseSet } from '../types/sets';
import { UnifiedExerciseData } from '../utils/unifiedExerciseUtils';
import { ActivityType } from '../types/activityTypes';
import { useSupersets } from '../context/SupersetContext';
import { getActivityTypeInfo } from './ActivityExerciseCard';

interface ExerciseCardProps {
  exercise: UnifiedExerciseData;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  exerciseNumber?: number; // Add exercise number prop
  subNumber?: number; // Add sub-number for exercises within a superset
  isHidden?: boolean;
  onToggleVisibility?: () => void;
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
  subNumber,
  isHidden = false,
  onToggleVisibility
}) => {
  const [showMenu, setShowMenu] = useState(false);
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

  // Render the exercise content based on type and visibility
  const renderExerciseContent = () => {
    if (isHidden) {
      // Compact view when hidden
      return (
        <div className="text-sm text-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Activity type badge if applicable */}
              {exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE && (
                <span className={`px-2 py-1 ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor} text-xs rounded-full`}>
                  {getActivityTypeInfo(exercise.activityType).label}
                </span>
              )}
              <span className="text-gray-400">
                {exercise.sets?.length || 0} set{(exercise.sets?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Show total volume for resistance exercises */}
            {exercise.sets && exercise.sets.length > 0 && exercise.sets[0].weight && (
              <span className="text-white font-medium">
                {calculateTotalVolume()}kg total
              </span>
            )}
          </div>
        </div>
      );
    }

    // Full view when expanded
    // Check if this is a non-resistance exercise
    const isNonResistance = (() => {
      // Priority 1: Direct ActivityType check for speed & agility
      if (exercise.activityType === ActivityType.SPEED_AGILITY) {
        return true;
      }

      // Priority 2: Check other non-resistance activity types
      if (exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE) {
        return true;
      }

      // Priority 3: Fallback detection for sets with activity-specific fields
      if (exercise.sets?.[0]) {
        const firstSet = exercise.sets[0];
        const hasResistanceFields = (firstSet.weight !== undefined && firstSet.weight >= 0) && firstSet.reps && firstSet.reps > 0;
        const hasActivityFields = firstSet.duration || firstSet.distance || firstSet.calories ||
                                firstSet.averageHeartRate || firstSet.holdTime || firstSet.pace;
        
        if (!hasResistanceFields && hasActivityFields) {
          return true;
        }
      }
      return false;
    })();

    if (isNonResistance) {
      // Non-resistance activity - display all sets
      return (
        <div className="text-sm text-gray-300">
          {/* Activity type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor} text-xs rounded-full`}>
              {getActivityTypeInfo(exercise.activityType).icon} {getActivityTypeInfo(exercise.activityType).label}
            </span>
            <span className="text-xs text-gray-400">
              {exercise.sets?.length || 0} set{(exercise.sets?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Display all sets */}
          {exercise.sets && exercise.sets.length > 0 && (
            <div className="space-y-3">
              {exercise.sets.map((set, setIndex) => {
                // Helper function to check if a value exists and is not empty
                const hasValue = (value: any): boolean => {
                  return value !== null && 
                         value !== undefined && 
                         value !== '' && 
                         !(typeof value === 'string' && value.trim() === '') &&
                         !(typeof value === 'number' && isNaN(value));
                  // Note: We don't exclude zero values as they might be legitimate (e.g., 0 calories)
                };
                
                const typeInfo = getActivityTypeInfo(exercise.activityType);
                
                return (
                  <div key={setIndex} className={`bg-gray-800/30 rounded-lg p-3 border-l-2 ${typeInfo.borderColor}`}>
                    <div className={`text-xs ${typeInfo.textColor} mb-2 font-medium`}>
                      Set {setIndex + 1}
                    </div>
                    
                    {/* Volume Metrics Row */}
                    <div className="flex flex-wrap gap-3 mb-2">
                      {hasValue(set.reps) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Reps</div>
                          <div className="text-white font-medium">{set.reps}</div>
                        </div>
                      )}
                      {hasValue(set.duration) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Duration</div>
                          <div className="text-white font-medium">
                            {(exercise.activityType || 'unknown') === 'endurance' ? `${set.duration} min` : `${set.duration} sec`}
                          </div>
                        </div>
                      )}
                      {hasValue(set.distance) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Distance</div>
                          <div className="text-white font-medium">
                            {(exercise.activityType || 'unknown') === 'endurance' ? `${set.distance} km` : `${set.distance} m`}
                          </div>
                        </div>
                      )}
                      {hasValue(set.calories) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Calories</div>
                          <div className="text-white font-medium">{set.calories} kcal</div>
                        </div>
                      )}
                      {hasValue(set.holdTime) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Hold Time</div>
                          <div className="text-white font-medium">{set.holdTime}s</div>
                        </div>
                      )}
                      {hasValue(set.stretchType) && (exercise.activityType === ActivityType.STRETCHING) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Stretch Type</div>
                          <div className="text-white font-medium capitalize">{set.stretchType}</div>
                        </div>
                      )}
                      {hasValue(set.restTime) && (exercise.activityType === ActivityType.SPEED_AGILITY) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Rest Time</div>
                          <div className="text-white font-medium">{set.restTime}s</div>
                        </div>
                      )}
                      {hasValue(set.rpe) && (exercise.activityType === ActivityType.SPEED_AGILITY) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">RPE</div>
                          <div className="text-white font-medium">{set.rpe}/10</div>
                        </div>
                      )}
                      {hasValue(set.pace) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Pace</div>
                          <div className="text-white font-medium">{set.pace}</div>
                        </div>
                      )}
                      {hasValue(set.elevation) && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-xs text-gray-400 mb-1">Elevation</div>
                          <div className="text-white font-medium">{set.elevation}m</div>
                        </div>
                      )}
                    </div>

                    {/* Strain Metrics - Heart Rate */}
                    {(hasValue(set.heartRate) || hasValue(set.maxHeartRate) || hasValue(set.averageHeartRate)) && (
                      <div className="bg-red-900/20 rounded p-2 mb-2">
                        <div className="text-xs text-red-300 mb-1 font-medium">Heart Rate</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {hasValue(set.averageHeartRate) && (
                            <div>
                              <span className="text-gray-400">Avg:</span>
                              <span className="text-white ml-1">{set.averageHeartRate} bpm</span>
                            </div>
                          )}
                          {hasValue(set.maxHeartRate) && (
                            <div>
                              <span className="text-gray-400">Max:</span>
                              <span className="text-white ml-1">{set.maxHeartRate} bpm</span>
                            </div>
                          )}
                          {hasValue(set.heartRate) && !hasValue(set.averageHeartRate) && (
                            <div>
                              <span className="text-gray-400">HR:</span>
                              <span className="text-white ml-1">{set.heartRate} bpm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Intensity Metrics */}
                    {((hasValue(set.rpe) && exercise.activityType !== ActivityType.SPEED_AGILITY) || 
                      (hasValue(set.intensity) && exercise.activityType !== ActivityType.SPEED_AGILITY) || 
                      hasValue(set.performance)) && (
                      <div className="bg-yellow-900/20 rounded p-2 mb-2">
                        <div className="text-xs text-yellow-300 mb-1 font-medium">Intensity</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {hasValue(set.rpe) && exercise.activityType !== ActivityType.SPEED_AGILITY && (
                            <div>
                              <span className="text-gray-400">RPE:</span>
                              <span className="text-white ml-1">{set.rpe}/10</span>
                            </div>
                          )}
                          {hasValue(set.intensity) && exercise.activityType !== ActivityType.SPEED_AGILITY && (
                            <div>
                              <span className="text-gray-400">Intensity:</span>
                              <span className="text-white ml-1">{set.intensity}/10</span>
                            </div>
                          )}
                          {hasValue(set.performance) && (
                            <div>
                              <span className="text-gray-400">Performance:</span>
                              <span className="text-white ml-1">{set.performance}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes - Only if they contain performance insights */}
                    {hasValue(set.notes) && (
                      <div className="bg-gray-800/40 rounded p-2 border-l-2 border-blue-500">
                        <div className="text-xs text-gray-400 mb-1">Notes</div>
                        <div className="text-white text-sm">{set.notes}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else if ('sets' in exercise && exercise.sets) {
      // Resistance exercise - show traditional sets display with additional fields
      return (
        <div className="text-sm">
          <div className="flex flex-wrap items-center mb-2">
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

          {/* Show performance-relevant resistance exercise data */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Volume</span>
              <span className="text-white">{calculateTotalVolume()}kg</span>
            </div>
            
            {/* Check for performance-relevant fields in resistance sets */}
            {(() => {
              const hasValue = (value: any): boolean => {
                return value !== null && 
                       value !== undefined && 
                       value !== '' && 
                       !(typeof value === 'string' && value.trim() === '') &&
                       !(typeof value === 'number' && isNaN(value));
              };

              const performanceFields: Array<{ label: string; value: string }> = [];
              
              // Check if any set has performance-relevant data
              exercise.sets.forEach((set: any) => {
                // Intensity metrics
                if (hasValue(set.rpe)) performanceFields.push({ label: 'RPE', value: `${set.rpe}/10` });
                if (hasValue(set.rir)) performanceFields.push({ label: 'RIR', value: `${set.rir} reps left` });
                if (hasValue(set.intensity)) performanceFields.push({ label: 'Intensity', value: `${set.intensity}/10` });
                if (hasValue(set.performance)) performanceFields.push({ label: 'Performance', value: `${set.performance}/10` });
                
                // Volume/Strain metrics
                if (hasValue(set.restTime)) performanceFields.push({ label: 'Rest Time', value: `${set.restTime}s` });
                if (hasValue(set.tempo)) performanceFields.push({ label: 'Tempo', value: set.tempo });
                
                // Performance notes only
                if (hasValue(set.notes)) performanceFields.push({ label: 'Performance Notes', value: set.notes });
              });

              // Remove duplicates and return unique fields
              const uniqueFields = performanceFields.filter((field, index, self) => 
                index === self.findIndex(f => f.label === field.label)
              );

              return uniqueFields.map((field, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-400">{field.label}</span>
                  <span className="text-white">{field.value}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      );
    } else {
      // Fallback for other exercise types
      return (
        <div className="text-sm text-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Type</span>
            <span className="text-white capitalize">{exercise.activityType || 'Exercise'}</span>
          </div>
        </div>
      );
    }
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
          {/* Toggle visibility button */}
          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label={isHidden ? "Show exercise details" : "Hide exercise details"}
            >
              <svg
                className={`w-4 h-4 text-gray-400 hover:text-white transition-transform ${isHidden ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        {showActions && (
          <div className="flex gap-2">
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
      </div>      <div className="mt-3">
        {renderExerciseContent()}
      </div>
    </div>
  );
};

export default ExerciseCard; 
