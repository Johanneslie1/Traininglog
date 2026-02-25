import React, { useState } from 'react';
import { ExerciseSet } from '@/types/sets';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';

interface ActivityExerciseCardProps {
  exercise: UnifiedExerciseData;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  exerciseNumber?: number;
  compact?: boolean;
}

// Activity type color configuration - shared across the app
export const getActivityTypeInfo = (activityType?: ActivityType) => {
  const type = normalizeActivityType(activityType);
  switch (type) {
    case ActivityType.RESISTANCE:
      return { 
        label: 'Resistance', 
        color: 'bg-blue-600', 
        textColor: 'text-blue-100',
        borderColor: 'border-blue-500',
        bgLight: 'bg-blue-600/10',
        icon: '🏋️'
      };
    case ActivityType.SPORT:
      return { 
        label: 'Sport', 
        color: 'bg-green-600', 
        textColor: 'text-green-100',
        borderColor: 'border-green-500',
        bgLight: 'bg-green-600/10',
        icon: '⚽'
      };
    case ActivityType.STRETCHING:
      return { 
        label: 'Stretching', 
        color: 'bg-purple-600', 
        textColor: 'text-purple-100',
        borderColor: 'border-purple-500',
        bgLight: 'bg-purple-600/10',
        icon: '🧘'
      };
    case ActivityType.ENDURANCE:
      return { 
        label: 'Endurance', 
        color: 'bg-orange-600', 
        textColor: 'text-orange-100',
        borderColor: 'border-orange-500',
        bgLight: 'bg-orange-600/10',
        icon: '🏃'
      };
    case ActivityType.SPEED_AGILITY:
      return { 
        label: 'Speed/Agility', 
        color: 'bg-red-600', 
        textColor: 'text-red-100',
        borderColor: 'border-red-500',
        bgLight: 'bg-red-600/10',
        icon: '⚡'
      };
    case ActivityType.OTHER:
      return { 
        label: 'Other', 
        color: 'bg-bg-tertiary', 
        textColor: 'text-gray-100',
        borderColor: 'border-gray-500',
        bgLight: 'bg-bg-tertiary/10',
        icon: '📋'
      };
    default:
      return { 
        label: 'Resistance', 
        color: 'bg-blue-600', 
        textColor: 'text-blue-100',
        borderColor: 'border-blue-500',
        bgLight: 'bg-blue-600/10',
        icon: '🏋️'
      };
  }
};

// Calculate summary metrics based on activity type
const calculateMetrics = (sets: ExerciseSet[], activityType?: ActivityType) => {
  if (!sets || sets.length === 0) return null;

  const type = normalizeActivityType(activityType);

  switch (type) {
    case ActivityType.RESISTANCE: {
      const totalVolume = sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
      const avgWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0) / sets.length;
      const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
      const maxWeight = Math.max(...sets.map(s => s.weight || 0));
      return { totalVolume, avgWeight, totalReps, maxWeight, setCount: sets.length };
    }
    case ActivityType.ENDURANCE: {
      const totalDistance = sets.reduce((sum, set) => sum + (set.distance || 0), 0);
      const totalDuration = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
      const totalCalories = sets.reduce((sum, set) => sum + (set.calories || 0), 0);
      const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;
      const avgHR = sets.filter(s => s.averageHeartRate).reduce((sum, s) => sum + (s.averageHeartRate || 0), 0) / 
                   (sets.filter(s => s.averageHeartRate).length || 1);
      return { totalDistance, totalDuration, totalCalories, avgPace, avgHR, setCount: sets.length };
    }
    case ActivityType.SPEED_AGILITY: {
      const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
      const totalTime = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
      const maxHeight = Math.max(...sets.map(s => s.height || 0));
      const avgRPE = sets.filter(s => s.rpe).reduce((sum, s) => sum + (s.rpe || 0), 0) / 
                    (sets.filter(s => s.rpe).length || 1);
      return { totalReps, totalTime, maxHeight, avgRPE, setCount: sets.length };
    }
    case ActivityType.STRETCHING: {
      const totalHoldTime = sets.reduce((sum, set) => sum + (set.holdTime || 0), 0);
      const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
      const avgIntensity = sets.filter(s => s.intensity).reduce((sum, s) => sum + (s.intensity || 0), 0) / 
                          (sets.filter(s => s.intensity).length || 1);
      return { totalHoldTime, totalReps, avgIntensity, setCount: sets.length };
    }
    case ActivityType.SPORT: {
      const totalDuration = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
      const totalCalories = sets.reduce((sum, set) => sum + (set.calories || 0), 0);
      const avgPerformance = sets.filter(s => s.performance).reduce((sum, s) => sum + (Number(s.performance) || 0), 0) / 
                            (sets.filter(s => s.performance).length || 1);
      return { totalDuration, totalCalories, avgPerformance, setCount: sets.length };
    }
    default: {
      const totalDuration = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
      return { totalDuration, setCount: sets.length };
    }
  }
};

// Format pace as min:sec per km
const formatPace = (paceMinPerKm: number): string => {
  if (!paceMinPerKm || paceMinPerKm === Infinity) return '--:--';
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
};

const ActivityExerciseCard: React.FC<ActivityExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  showActions = true,
  exerciseNumber,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const activityType = normalizeActivityType(exercise.activityType);
  const typeInfo = getActivityTypeInfo(activityType);
  const metrics = calculateMetrics(exercise.sets, activityType);

  // Render compact summary based on activity type
  const renderCompactSummary = () => {
    if (!metrics) return <span className="text-text-tertiary">No data</span>;

    switch (activityType) {
      case ActivityType.RESISTANCE:
        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-primary font-medium">
              {metrics.setCount}×{Math.round((metrics as any).totalReps / metrics.setCount)}
              {(metrics as any).avgWeight > 0 && ` @ ${Math.round((metrics as any).avgWeight)}kg`}
            </span>
            <span className="text-text-tertiary">
              {(metrics as any).totalVolume.toLocaleString()}kg vol
            </span>
          </div>
        );
      case ActivityType.ENDURANCE:
        return (
          <div className="flex items-center gap-3 text-sm">
            {(metrics as any).totalDistance > 0 && (
              <span className="text-text-primary font-medium">{(metrics as any).totalDistance.toFixed(1)}km</span>
            )}
            <span className="text-text-tertiary">{(metrics as any).totalDuration}min</span>
            {(metrics as any).avgPace > 0 && (
              <span className="text-orange-300">{formatPace((metrics as any).avgPace)}</span>
            )}
          </div>
        );
      case ActivityType.SPEED_AGILITY:
        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-primary font-medium">{(metrics as any).totalReps} reps</span>
            {(metrics as any).totalTime > 0 && (
              <span className="text-text-tertiary">{(metrics as any).totalTime}s</span>
            )}
            {(metrics as any).maxHeight > 0 && (
              <span className="text-red-300">{(metrics as any).maxHeight}cm</span>
            )}
          </div>
        );
      case ActivityType.STRETCHING:
        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-primary font-medium">{(metrics as any).totalHoldTime}s hold</span>
            {(metrics as any).totalReps > 0 && (
              <span className="text-text-tertiary">×{(metrics as any).totalReps}</span>
            )}
            {(metrics as any).avgIntensity > 0 && (
              <span className="text-purple-300">{Math.round((metrics as any).avgIntensity)}/10</span>
            )}
          </div>
        );
      case ActivityType.SPORT:
        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-primary font-medium">{(metrics as any).totalDuration}min</span>
            {(metrics as any).avgPerformance > 0 && (
              <span className="text-green-300">★ {(metrics as any).avgPerformance.toFixed(1)}</span>
            )}
            {(metrics as any).totalCalories > 0 && (
              <span className="text-text-tertiary">{(metrics as any).totalCalories}kcal</span>
            )}
          </div>
        );
      default:
        return (
          <span className="text-text-tertiary text-sm">
            {metrics.setCount} set{metrics.setCount !== 1 ? 's' : ''}
          </span>
        );
    }
  };

  // Render expanded details with all sets
  const renderExpandedDetails = () => {
    if (!exercise.sets || exercise.sets.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {exercise.sets.map((set, index) => (
          <div 
            key={index} 
            className={`p-2 rounded-lg ${typeInfo.bgLight} border-l-2 ${typeInfo.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">Set {index + 1}</span>
              {renderSetDetails(set)}
            </div>
          </div>
        ))}
        
        {/* Summary row */}
        {metrics && (
          <div className={`p-2 rounded-lg ${typeInfo.color}/20 border ${typeInfo.borderColor}/30`}>
            <div className="text-xs text-text-secondary mb-1">Summary</div>
            {renderMetricsSummary()}
          </div>
        )}
      </div>
    );
  };

  // Render individual set details based on activity type
  const renderSetDetails = (set: ExerciseSet) => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-primary font-medium">{set.weight}kg × {set.reps}</span>
            {set.rir !== undefined && <span className="text-text-secondary">RIR {set.rir}</span>}
            {set.rpe !== undefined && <span className="text-text-secondary">RPE {set.rpe}</span>}
          </div>
        );
      case ActivityType.ENDURANCE:
        return (
          <div className="flex items-center gap-2 text-sm">
            {set.duration && <span className="text-text-primary">{set.duration}min</span>}
            {set.distance && <span className="text-text-secondary">{set.distance}km</span>}
            {set.averageHeartRate && <span className="text-text-secondary">♥ {set.averageHeartRate}</span>}
            {set.calories && <span className="text-text-tertiary">{set.calories}kcal</span>}
          </div>
        );
      case ActivityType.SPEED_AGILITY:
        return (
          <div className="flex items-center gap-2 text-sm">
            {set.reps && <span className="text-text-primary">{set.reps} reps</span>}
            {set.duration && <span className="text-text-secondary">{set.duration}s</span>}
            {set.distance && <span className="text-text-tertiary">{set.distance}m</span>}
            {set.height && <span className="text-text-secondary">{set.height}cm</span>}
          </div>
        );
      case ActivityType.STRETCHING:
        return (
          <div className="flex items-center gap-2 text-sm">
            {set.holdTime && <span className="text-text-primary">{set.holdTime}s</span>}
            {set.reps && <span className="text-text-primary">×{set.reps}</span>}
            {set.intensity && <span className="text-text-tertiary">{set.intensity}/10</span>}
            {set.stretchType && <span className="text-text-secondary text-xs">{set.stretchType}</span>}
          </div>
        );
      case ActivityType.SPORT:
        return (
          <div className="flex items-center gap-2 text-sm">
            {set.duration && <span className="text-text-primary">{set.duration}min</span>}
            {set.performance && <span className="text-green-300">★ {set.performance}</span>}
            {set.calories && <span className="text-text-tertiary">{set.calories}kcal</span>}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-sm">
            {set.duration && <span className="text-text-primary">{set.duration}min</span>}
            {set.reps && <span className="text-text-tertiary">{set.reps} reps</span>}
          </div>
        );
    }
  };

  // Render metrics summary for expanded view
  const renderMetricsSummary = () => {
    if (!metrics) return null;

    switch (activityType) {
      case ActivityType.RESISTANCE:
        return (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-text-tertiary">Volume</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalVolume.toLocaleString()}kg</div>
            </div>
            <div>
              <span className="text-text-tertiary">Max</span>
              <div className="text-text-primary font-medium">{(metrics as any).maxWeight}kg</div>
            </div>
            <div>
              <span className="text-text-tertiary">Reps</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalReps}</div>
            </div>
          </div>
        );
      case ActivityType.ENDURANCE:
        return (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-text-tertiary">Distance</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalDistance.toFixed(1)}km</div>
            </div>
            <div>
              <span className="text-text-tertiary">Time</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalDuration}min</div>
            </div>
            <div>
              <span className="text-text-tertiary">Pace</span>
              <div className="text-text-primary font-medium">{formatPace((metrics as any).avgPace)}</div>
            </div>
          </div>
        );
      case ActivityType.SPEED_AGILITY:
        return (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-text-tertiary">Total Reps</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalReps}</div>
            </div>
            <div>
              <span className="text-text-tertiary">Time</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalTime}s</div>
            </div>
            {(metrics as any).maxHeight > 0 && (
              <div>
                <span className="text-text-tertiary">Max Height</span>
                <div className="text-text-primary font-medium">{(metrics as any).maxHeight}cm</div>
              </div>
            )}
          </div>
        );
      case ActivityType.STRETCHING:
        return (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-text-tertiary">Hold Time</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalHoldTime}s</div>
            </div>
            <div>
              <span className="text-text-tertiary">Reps</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalReps}</div>
            </div>
            {(metrics as any).avgIntensity > 0 && (
              <div>
                <span className="text-text-tertiary">Avg Intensity</span>
                <div className="text-text-primary font-medium">{Math.round((metrics as any).avgIntensity)}/10</div>
              </div>
            )}
          </div>
        );
      case ActivityType.SPORT:
        return (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-text-tertiary">Duration</span>
              <div className="text-text-primary font-medium">{(metrics as any).totalDuration}min</div>
            </div>
            {(metrics as any).totalCalories > 0 && (
              <div>
                <span className="text-text-tertiary">Calories</span>
                <div className="text-text-primary font-medium">{(metrics as any).totalCalories}kcal</div>
              </div>
            )}
            {(metrics as any).avgPerformance > 0 && (
              <div>
                <span className="text-text-tertiary">Performance</span>
                <div className="text-text-primary font-medium">{(metrics as any).avgPerformance.toFixed(1)}/10</div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="text-xs text-text-tertiary">
            {metrics.setCount} set{metrics.setCount !== 1 ? 's' : ''} recorded
          </div>
        );
    }
  };

  return (
    <div 
      className={`
        bg-bg-secondary rounded-lg overflow-hidden transition-all duration-200
        border-l-4 ${typeInfo.borderColor}
        hover:bg-bg-tertiary
      `}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Exercise number */}
            {exerciseNumber && (
              <div className={`flex items-center justify-center min-w-6 h-6 ${typeInfo.color} text-text-primary text-xs font-bold rounded-full px-1.5`}>
                {exerciseNumber}
              </div>
            )}
            
            {/* Activity type icon */}
            <span className="text-lg">{typeInfo.icon}</span>
            
            {/* Exercise name */}
            <h3 className="text-base font-medium text-text-primary truncate">{exercise.exerciseName}</h3>
            
            {/* Activity type badge */}
            <span className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color} ${typeInfo.textColor} flex-shrink-0`}>
              {typeInfo.label}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Expand/collapse button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              <svg
                className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showActions && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Compact summary - always visible */}
        <div className="mt-2">
          {renderCompactSummary()}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {renderExpandedDetails()}
        </div>
      )}
    </div>
  );
};

export default ActivityExerciseCard;
