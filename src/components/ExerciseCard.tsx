import React, { useState, useRef, useEffect } from 'react';
import { ExerciseSet } from '../types/sets';
import { UnifiedExerciseData } from '../utils/unifiedExerciseUtils';
import { ActivityType } from '../types/activityTypes';
import { useSupersets } from '../context/SupersetContext';
import { getActivityTypeInfo } from './ActivityExerciseCard';
import { OneRepMaxPrediction } from '@/utils/oneRepMax';

interface ExerciseCardProps {
  exercise: UnifiedExerciseData;
  oneRepMaxPrediction?: OneRepMaxPrediction;
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
  oneRepMaxPrediction,
  onEdit,
  onDelete,
  showActions = true,
  exerciseNumber,
  subNumber,
  isHidden = false,
  onToggleVisibility
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSetDetails, setShowSetDetails] = useState(false);
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
        <div className="text-sm text-text-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Activity type badge if applicable */}
              {exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE && (
                <span className={`px-2 py-1 ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor} text-xs rounded-full`}>
                  {getActivityTypeInfo(exercise.activityType).label}
                </span>
              )}
              <span className="text-text-tertiary">
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
        <div className="text-sm text-text-secondary">
          {/* Activity type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor} text-xs rounded-full`}>
              {getActivityTypeInfo(exercise.activityType).icon} {getActivityTypeInfo(exercise.activityType).label}
            </span>
            <span className="text-xs text-text-tertiary">
              {exercise.sets?.length || 0} set{(exercise.sets?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          <button
            onClick={() => setShowSetDetails((current) => !current)}
            className="mb-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Toggle set details"
          >
            {showSetDetails ? 'Hide set metrics' : 'Show set metrics'}
          </button>
          
          {/* Display all sets */}
          {showSetDetails && exercise.sets && exercise.sets.length > 0 && (
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
                  <div key={setIndex} className={`bg-bg-tertiary rounded-lg p-3 border-l-2 ${typeInfo.borderColor}`}>
                    <div className={`text-xs ${typeInfo.textColor} mb-2 font-medium`}>
                      Set {setIndex + 1}
                    </div>
                    
                    {/* Volume Metrics Row */}
                    <div className="flex flex-wrap gap-3 mb-2">
                      {hasValue(set.reps) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Reps</div>
                          <div className="text-data-field-text font-medium">{set.reps}</div>
                        </div>
                      )}
                      {hasValue(set.duration) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Duration</div>
                          <div className="text-data-field-text font-medium">
                            {(exercise.activityType || 'unknown') === 'endurance' ? `${set.duration} min` : `${set.duration} sec`}
                          </div>
                        </div>
                      )}
                      {hasValue(set.distance) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Distance</div>
                          <div className="text-data-field-text font-medium">
                            {(exercise.activityType || 'unknown') === 'endurance' ? `${set.distance} km` : `${set.distance} m`}
                          </div>
                        </div>
                      )}
                      {hasValue(set.calories) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Calories</div>
                          <div className="text-data-field-text font-medium">{set.calories} kcal</div>
                        </div>
                      )}
                      {hasValue(set.holdTime) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Hold Time</div>
                          <div className="text-data-field-text font-medium">{set.holdTime}s</div>
                        </div>
                      )}
                      {hasValue(set.stretchType) && (exercise.activityType === ActivityType.STRETCHING) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Stretch Type</div>
                          <div className="text-data-field-text font-medium capitalize">{set.stretchType}</div>
                        </div>
                      )}
                      {hasValue(set.restTime) && (exercise.activityType === ActivityType.SPEED_AGILITY) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Rest Time</div>
                          <div className="text-data-field-text font-medium">{set.restTime}s</div>
                        </div>
                      )}
                      {hasValue(set.rpe) && (exercise.activityType === ActivityType.SPEED_AGILITY) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">RPE</div>
                          <div className="text-data-field-text font-medium">{set.rpe}/10</div>
                        </div>
                      )}
                      {hasValue(set.pace) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Pace</div>
                          <div className="text-data-field-text font-medium">{set.pace}</div>
                        </div>
                      )}
                      {hasValue(set.elevation) && (
                        <div className="bg-data-field-bg rounded p-2">
                          <div className="text-xs text-data-field-label mb-1">Elevation</div>
                          <div className="text-data-field-text font-medium">{set.elevation}m</div>
                        </div>
                      )}
                    </div>

                    {/* Strain Metrics - Heart Rate */}
                    {(hasValue(set.heartRate) || hasValue(set.maxHeartRate) || hasValue(set.averageHeartRate)) && (
                      <div className="bg-status-heart-bg rounded p-2 mb-2 border border-status-heart-border">
                        <div className="text-xs text-status-heart-text mb-1 font-medium">Heart Rate</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {hasValue(set.averageHeartRate) && (
                            <div>
                              <span className="text-text-tertiary">Avg:</span>
                              <span className="text-text-primary ml-1">{set.averageHeartRate} bpm</span>
                            </div>
                          )}
                          {hasValue(set.maxHeartRate) && (
                            <div>
                              <span className="text-text-tertiary">Max:</span>
                              <span className="text-text-primary ml-1">{set.maxHeartRate} bpm</span>
                            </div>
                          )}
                          {hasValue(set.heartRate) && !hasValue(set.averageHeartRate) && (
                            <div>
                              <span className="text-text-tertiary">HR:</span>
                              <span className="text-text-primary ml-1">{set.heartRate} bpm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Intensity Metrics */}
                    {((hasValue(set.rpe) && exercise.activityType !== ActivityType.SPEED_AGILITY) || 
                      (hasValue(set.intensity) && exercise.activityType !== ActivityType.SPEED_AGILITY) || 
                      hasValue(set.performance)) && (
                      <div className="bg-status-intensity-bg rounded p-2 mb-2 border border-status-intensity-border">
                        <div className="text-xs text-status-intensity-text mb-1 font-medium">Intensity</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {hasValue(set.rpe) && exercise.activityType !== ActivityType.SPEED_AGILITY && (
                            <div>
                              <span className="text-text-tertiary">RPE:</span>
                              <span className="text-text-primary ml-1">{set.rpe}/10</span>
                            </div>
                          )}
                          {hasValue(set.intensity) && exercise.activityType !== ActivityType.SPEED_AGILITY && (
                            <div>
                              <span className="text-text-tertiary">Intensity:</span>
                              <span className="text-text-primary ml-1">{set.intensity}/10</span>
                            </div>
                          )}
                          {hasValue(set.performance) && (
                            <div>
                              <span className="text-text-tertiary">Performance:</span>
                              <span className="text-text-primary ml-1">{set.performance}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes - Only if they contain performance insights */}
                    {hasValue(set.notes) && (
                      <div className="bg-gray-800/40 rounded p-2 border-l-2 border-blue-500">
                        <div className="text-xs text-text-tertiary mb-1">Notes</div>
                        <div className="text-text-primary text-sm">{set.notes}</div>
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

          <button
            onClick={() => setShowSetDetails((current) => !current)}
            className="mb-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Toggle set details"
          >
            {showSetDetails ? 'Hide set metrics' : 'Show set metrics'}
          </button>

          {/* Show performance-relevant resistance exercise data */}
          {showSetDetails && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-tertiary">Total Volume</span>
                <span className="text-text-primary">{calculateTotalVolume()}kg</span>
              </div>

              {oneRepMaxPrediction && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Predicted 1RM</span>
                    <span className="text-text-primary">{oneRepMaxPrediction.oneRepMax.toFixed(1)}kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Best Set</span>
                    <span className="text-text-primary">
                      {(oneRepMaxPrediction.bestSet.weight || 0)}kg × {(oneRepMaxPrediction.bestSet.reps || 0)}
                    </span>
                  </div>
                </>
              )}
              
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
                    <span className="text-text-tertiary">{field.label}</span>
                    <span className="text-text-primary">{field.value}</span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      );
    } else {
      // Fallback for other exercise types
      return (
        <div className="text-sm text-text-secondary">
          <div className="flex items-center justify-between">
            <span className="text-text-tertiary">Type</span>
            <span className="text-text-primary capitalize">{exercise.activityType || 'Exercise'}</span>
          </div>
        </div>
      );
    }
  };

  const cardClassName = `bg-bg-secondary rounded-lg p-3 transition-all duration-200 ${
    isInSuperset 
      ? 'bg-blue-500/5 dark:bg-[#2196F3]/5' 
      : isSelected 
      ? 'bg-accent-primary/10 border-l-2 border-accent-primary' 
      : 'hover:bg-bg-tertiary'
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
            className="w-4 h-4 text-accent-primary bg-gray-100 border-gray-300 rounded focus:ring-accent-primary focus:ring-2"
          />
          <span className="text-sm text-text-secondary">Select for superset</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Compact exercise number with optional sub-number */}
          {exerciseNumber && (
            <div className="flex items-center justify-center min-w-6 h-6 bg-accent-primary text-text-primary text-xs font-bold rounded-full px-1.5">
              {exerciseNumber}{subNumber ? String.fromCharCode(96 + subNumber) : ''}
            </div>
          )}
          <h3 className="text-base font-medium text-text-primary">{exercise.exerciseName}</h3>
          {/* Toggle visibility button */}
          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label={isHidden ? "Show exercise details" : "Hide exercise details"}
            >
              <svg
                className={`w-4 h-4 text-text-tertiary hover:text-text-primary transition-transform ${isHidden ? 'rotate-180' : ''}`}
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
                  ? 'bg-[#2196F3] text-text-primary' // Blue for existing superset
                  : isSelected
                    ? 'bg-accent-primary text-text-primary' // Purple/accent for selected
                    : 'hover:bg-white/10 text-text-tertiary hover:text-text-primary'
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
                <svg className="w-5 h-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
