import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Exercise } from '@/types/exercise';
import type { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { DifficultyCategory } from '@/types/difficulty';
import { toast } from 'react-hot-toast';

interface UniversalSetLoggerProps {
  exercise: Exercise;
  onSave: (sets: ExerciseSet[]) => void;
  onCancel: () => void;
  initialSets?: ExerciseSet[];
  isEditing?: boolean;
}

// RPE Scale for reference
const RPE_SCALE = {
  1: { label: 'Very Easy', description: 'No exertion at all' },
  2: { label: 'Easy', description: 'Extremely light exertion' },
  3: { label: 'Light', description: 'Very light exertion' },
  4: { label: 'Moderate-', description: 'Light exertion' },
  5: { label: 'Moderate', description: 'Moderate exertion' },
  6: { label: 'Moderate+', description: 'Somewhat hard exertion' },
  7: { label: 'Hard', description: 'Hard exertion' },
  8: { label: 'Very Hard', description: 'Very hard exertion' },
  9: { label: 'Extremely Hard', description: 'Extremely hard exertion' },
  10: { label: 'Maximum', description: 'Maximum exertion' }
} as const;

// RIR Scale for reference
const RIR_SCALE = {
  0: 'No reps left',
  1: '1 rep left',
  2: '2 reps left',
  3: '3 reps left',
  4: '4 reps left',
  5: '5+ reps left'
} as const;

// Determine exercise type from exercise data
const getExerciseType = (exercise: Exercise): string => {
  // Check activityType first
  if (exercise.activityType) {
    switch (exercise.activityType) {
      case ActivityType.RESISTANCE: return 'strength';
      case ActivityType.ENDURANCE: return 'endurance';
      case ActivityType.STRETCHING: return 'flexibility';
      case ActivityType.SPORT: return 'sport';
      case ActivityType.SPEED_AGILITY: return 'speed_agility';
      case ActivityType.OTHER: return 'other';
    }
  }

  // Check type field
  if (exercise.type) {
    switch (exercise.type) {
      case 'strength':
      case 'bodyweight': return 'strength';
      case 'cardio':
      case 'endurance': return 'endurance';
      case 'flexibility': return 'flexibility';
      case 'teamSports': return 'sport';
      case 'plyometrics':
      case 'speedAgility':
      case 'speed_agility': return 'speed_agility';
      default: return exercise.type;
    }
  }

  // Check exercise name for patterns
  const exerciseName = exercise.name?.toLowerCase() || '';
  
  // Endurance activities
  if (exerciseName.includes('treadmill') || 
      exerciseName.includes('running') || 
      exerciseName.includes('jogging') ||
      exerciseName.includes('cycling') ||
      exerciseName.includes('swimming') ||
      exerciseName.includes('rowing') ||
      exerciseName.includes('elliptical') ||
      exerciseName.includes('cardio')) {
    return 'endurance';
  }
  
  // Sport activities
  if (exerciseName.includes('soccer') || 
      exerciseName.includes('football') ||
      exerciseName.includes('basketball') ||
      exerciseName.includes('tennis') ||
      exerciseName.includes('volleyball') ||
      exerciseName.includes('hockey') ||
      exerciseName.includes('baseball') ||
      exerciseName.includes('badminton')) {
    return 'sport';
  }
  
  // Speed & Agility activities
  if (exerciseName.includes('high knees') ||
      exerciseName.includes('butt kicks') ||
      exerciseName.includes('ladder') ||
      exerciseName.includes('cone') ||
      exerciseName.includes('sprint') ||
      exerciseName.includes('agility') ||
      exerciseName.includes('plyometric') ||
      exerciseName.includes('jump') ||
      exerciseName.includes('hop') ||
      exerciseName.includes('bounds')) {
    return 'speed_agility';
  }
  
  // Flexibility activities
  if (exerciseName.includes('stretch') ||
      exerciseName.includes('yoga') ||
      exerciseName.includes('mobility') ||
      exerciseName.includes('foam roll') ||
      exerciseName.includes('massage')) {
    return 'flexibility';
  }

  // Check category for hints
  const category = exercise.category?.toLowerCase() || '';
  if (category.includes('cardio') || category.includes('running') || category.includes('cycling')) {
    return 'endurance';
  }
  if (category.includes('stretch') || category.includes('yoga') || category.includes('mobility')) {
    return 'flexibility';
  }
  if (category.includes('sport') || category.includes('team')) {
    return 'sport';
  }
  if (category.includes('plyometric') || category.includes('agility') || category.includes('speed')) {
    return 'speed_agility';
  }

  // Default to strength
  return 'strength';
};

// Get default set structure based on exercise type
const getDefaultSet = (exerciseType: string): ExerciseSet => {
  const baseSet: ExerciseSet = {
    weight: 0,
    reps: 0,
    difficulty: DifficultyCategory.EASY
  };

  switch (exerciseType) {
    case 'strength':
    case 'bodyweight':
      return {
        ...baseSet,
        weight: 0,
        reps: 5,
        rir: 0
      };

    case 'endurance':
      return {
        ...baseSet,
        weight: 0,
        reps: 0,
        duration: 0, // minutes
        distance: 0, // km
        rpe: 0,
        hrZone1: 0,
        hrZone2: 0,
        hrZone3: 0,
        hrZone4: 0,
        hrZone5: 0
      };

    case 'flexibility':
      return {
        ...baseSet,
        weight: 0,
        reps: 5, // 5 reps default for flexibility session
        holdTime: 0, // seconds
        intensity: 0,
        stretchType: 'static'
      };

    case 'sport':
      return {
        ...baseSet,
        weight: 0,
        reps: 0,
        duration: 0, // minutes
        rpe: 0,
        calories: 0,
        performance: '0'
      };

    case 'speed_agility':
      return {
        ...baseSet,
        weight: 0,
        reps: 5,
        duration: 0, // seconds per set
        distance: 0, // meters for sprints
        height: 0, // cm for jumps
        restTime: 0, // seconds between sets
        intensity: 0, // intensity rating 1-10
        rpe: 0
      };

    case 'other':
    default:
      return {
        ...baseSet,
        weight: 0,
        reps: 0,
        duration: 0, // minutes
        rpe: 0
      };
  }
};

export const UniversalSetLogger: React.FC<UniversalSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  initialSets = [],
  isEditing = false,
}) => {
  const exerciseType = getExerciseType(exercise);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [showRPEHelper, setShowRPEHelper] = useState(false);
  
  // Track unique IDs for sets to prevent key issues
  const [setIds, setSetIds] = useState<string[]>([]);

  // Initialize sets
  useEffect(() => {
    if (initialSets && initialSets.length > 0) {
      // Deep clone the initial sets to prevent reference issues
      const clonedSets = initialSets.map(set => ({ ...set }));
      setSets(clonedSets);
      // Generate stable IDs for existing sets
      const ids = clonedSets.map((_, index) => `set-${exercise.name}-${index}-${Date.now()}`);
      setSetIds(ids);
    } else {
      const defaultSet = getDefaultSet(exerciseType);
      setSets([defaultSet]);
      setSetIds([`set-${exercise.name}-0-${Date.now()}`]);
    }
  }, [initialSets, exerciseType, exercise.name]);

  const addSet = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    const newSet = lastSet ? { ...lastSet } : getDefaultSet(exerciseType);
    const newId = `set-${exercise.name}-${sets.length}`;
    setSets(prev => [...prev, newSet]);
    setSetIds(prev => [...prev, newId]);
  }, [sets, exerciseType, exercise.name]);

  const removeSet = useCallback((index: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
      setSetIds(prev => prev.filter((_, i) => i !== index));
    }
  }, [sets]);

  const updateSet = useCallback((index: number, field: keyof ExerciseSet, value: any) => {
    setSets(prev => {
      // Create a deep copy to ensure React detects the change
      const newSets = prev.map((set, i) => {
        if (i === index) {
          return { ...set, [field]: value };
        }
        return set;
      });
      return newSets;
    });
  }, []);

  const copyPreviousSet = useCallback((index: number) => {
    if (index > 0) {
      const previousSet = sets[index - 1];
      setSets(prev => {
        const newSets = [...prev];
        newSets[index] = { ...previousSet };
        return newSets;
      });
      toast.success('Copied previous set values');
    }
  }, [sets]);

  const handleSave = () => {
    // Option 3: Relaxed validation - only require at least one field per set
    const validSets = sets.filter(set => {
      switch (exerciseType) {
        case 'strength':
        case 'bodyweight':
          // Only require reps > 0, weight can be zero or undefined
          return set.reps > 0;
        case 'endurance':
        case 'sport':
        case 'other':
          return (set.duration && set.duration > 0) ||
                 (set.distance && set.distance > 0) ||
                 (set.calories && set.calories > 0) ||
                 (set.rpe && set.rpe > 0);
        case 'flexibility':
          return (set.reps && set.reps > 0) ||
                 (set.holdTime && set.holdTime > 0) ||
                 (set.intensity && set.intensity > 0);
        case 'speed_agility':
          return (set.reps > 0) ||
                 (set.duration && set.duration > 0) ||
                 (set.distance && set.distance > 0) ||
                 (set.height && set.height > 0);
        default:
          return true;
      }
    });

    if (validSets.length === 0) {
      toast.error('Please fill in the required fields for each set');
      return;
    }

    // Warn about incomplete sets but still save them
    const incompleteCount = sets.length - validSets.length;
    if (incompleteCount > 0) {
      toast(`Note: ${incompleteCount} set(s) have minimal data but will be saved`, {
        duration: 3000,
      });
    }

    onSave(validSets);
  };

  const renderFieldsForSet = useMemo(() => (setIndex: number) => {
    const set = sets[setIndex];
    if (!set) return null;

    const fields: React.ReactNode[] = [];

    // Common function to render input field
    const renderField = (
      field: keyof ExerciseSet,
      label: string,
      type: 'number' | 'text' = 'number',
      min?: number,
      step?: number,
      placeholder?: string,
      withButtons?: boolean
    ) => {
      // Always get the current set value directly from the state
      const currentValue = sets[setIndex]?.[field];
      const displayValue = currentValue !== undefined && currentValue !== null ? String(currentValue) : '';
      
      return (
        <div key={field} className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">{label}</label>
          <div className="flex items-center gap-2">
            {withButtons && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentNumValue = Number(sets[setIndex]?.[field]) || 0;
                  const newValue = Math.max(min || 0, currentNumValue - (step || 1));
                  updateSet(setIndex, field, newValue);
                }}
                className="resistance-button flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-base sm:text-sm font-semibold transition-colors"
                aria-label={`Decrease ${label.toLowerCase()}`}
              >
                -
              </button>
            )}
            <input
              type={type}
              value={displayValue}
              onChange={(e) => {
                e.stopPropagation();
                const inputValue = e.target.value;
                
                if (type === 'number') {
                  // Handle empty input or partial numbers
                  if (inputValue === '' || inputValue === '-' || inputValue === '.') {
                    updateSet(setIndex, field, inputValue === '' ? 0 : inputValue);
                  } else {
                    const numValue = parseFloat(inputValue);
                    if (!isNaN(numValue)) {
                      updateSet(setIndex, field, numValue);
                    }
                  }
                } else {
                  updateSet(setIndex, field, inputValue);
                }
              }}
              onFocus={(e) => {
                e.stopPropagation();
              }}
              className="resistance-input resistance-input-control flex-1 min-w-0 px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              min={min}
              step={step}
              placeholder={placeholder}
            />
            {withButtons && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentNumValue = Number(sets[setIndex]?.[field]) || 0;
                  const newValue = currentNumValue + (step || 1);
                  updateSet(setIndex, field, newValue);
                }}
                className="resistance-button flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-base sm:text-sm font-semibold transition-colors"
                aria-label={`Increase ${label.toLowerCase()}`}
              >
                +
              </button>
            )}
          </div>
        </div>
      );
    };

    // Render fields based on exercise type
    switch (exerciseType) {
      case 'strength':
      case 'bodyweight':
        fields.push(
          <div key="sets-reps" className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {renderField('reps', 'Reps *', 'number', 1, 1, undefined, true)}
            {renderField('weight', 'Weight (kg)', 'number', 0, 0.5, undefined, true)}
          </div>
        );
        fields.push(
          <div key="rir" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">RIR (Reps in Reserve)</label>
            <select
              value={sets[setIndex]?.rir !== undefined ? sets[setIndex].rir : ''}
              onChange={(e) => {
                e.stopPropagation();
                const value = e.target.value;
                if (value === '') {
                  updateSet(setIndex, 'rir', undefined);
                } else {
                  updateSet(setIndex, 'rir', parseInt(value));
                }
              }}
              onFocus={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Select RIR</option>
              {Object.entries(RIR_SCALE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        );
        break;

      case 'endurance':
        fields.push(
          <div key="duration-distance" className="grid grid-cols-2 gap-4">
            {renderField('duration', 'Duration (minutes) *', 'number', 0.1, 0.1)}
            {renderField('distance', 'Distance (km)', 'number', 0, 0.1)}
          </div>
        );
        fields.push(renderField('calories', 'Calories', 'number', 0));
        fields.push(
          <div key="hr-avg-max" className="grid grid-cols-2 gap-4">
            {renderField('averageHeartRate', 'Average HR (bpm)', 'number', 40, 1)}
            {renderField('maxHeartRate', 'Max HR (bpm)', 'number', 60, 1)}
          </div>
        );
        fields.push(renderField('elevation', 'Elevation Gain (m)', 'number', 0));
        
        // Heart Rate Zones (collapsible)
        fields.push(
          <div key="hr-zones" className="space-y-3">
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById(`hr-zones-${setIndex}`);
                if (element) {
                  element.style.display = element.style.display === 'none' ? 'block' : 'none';
                }
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <span>Heart Rate Zones (minutes)</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div id={`hr-zones-${setIndex}`} style={{ display: 'none' }} className="space-y-3 pl-3">
              <div className="text-xs text-gray-400 mb-2">
                Zone 1: Recovery (50-60%) • Zone 2: Base (60-70%) • Zone 3: Tempo (70-80%) • Zone 4: Threshold (80-90%) • Zone 5: Max (90-100%)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {renderField('hrZone1', 'Zone 1 (min)', 'number', 0, 0.1)}
                {renderField('hrZone2', 'Zone 2 (min)', 'number', 0, 0.1)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {renderField('hrZone3', 'Zone 3 (min)', 'number', 0, 0.1)}
                {renderField('hrZone4', 'Zone 4 (min)', 'number', 0, 0.1)}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {renderField('hrZone5', 'Zone 5 (min)', 'number', 0, 0.1)}
              </div>
            </div>          </div>
        );
        break;      case 'flexibility':
        fields.push(renderField('reps', 'Repetitions', 'number', 1));
        fields.push(renderField('holdTime', 'Hold Time (seconds)', 'number', 1));
        
        // Intensity dropdown like RPE
        fields.push(
          <div key="intensity" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              Intensity
            </label>
            <select
              value={sets[setIndex]?.intensity !== undefined ? sets[setIndex].intensity : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  updateSet(setIndex, 'intensity', undefined);
                } else {
                  updateSet(setIndex, 'intensity', parseInt(value));
                }
              }}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Intensity</option>
              <option value="1">1 - Very Light</option>
              <option value="2">2 - Light</option>
              <option value="3">3 - Moderate-Light</option>
              <option value="4">4 - Moderate</option>
              <option value="5">5 - Moderate-Hard</option>
              <option value="6">6 - Hard</option>
              <option value="7">7 - Very Hard</option>
              <option value="8">8 - Extremely Hard</option>
              <option value="9">9 - Near Maximum</option>
              <option value="10">10 - Maximum</option>
            </select>
          </div>
        );
        
        fields.push(
          <div key="stretch-type" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              Stretch Type
            </label>
            <select
              value={sets[setIndex]?.stretchType || 'static'}
              onChange={(e) => updateSet(setIndex, 'stretchType', e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="static">Static Stretching</option>
              <option value="dynamic">Dynamic Stretching</option>
              <option value="pnf">PNF (Proprioceptive Neuromuscular Facilitation)</option>
              <option value="yoga">Yoga</option>
              <option value="mobility">Mobility Flow</option>
            </select>
          </div>
        );
        break;      case 'sport':
        fields.push(renderField('duration', 'Duration (minutes) *', 'number', 1));
        fields.push(renderField('distance', 'Distance (km)', 'number', 0, 0.1));
        fields.push(renderField('calories', 'Calories', 'number', 0));
        
        // Performance-focused fields only
        fields.push(
          <div key="performance" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              Performance Rating (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={sets[setIndex]?.performance !== undefined ? sets[setIndex].performance : ''}
              onChange={(e) => {
                const value = e.target.value;
                
                if (value === '') {
                  updateSet(setIndex, 'performance', undefined);
                } else {
                  const numValue = Number(value);
                  if (!isNaN(numValue)) {
                    updateSet(setIndex, 'performance', value);
                  }
                }
              }}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Rate your performance"
            />
          </div>
        );
        break;      case 'speed_agility':
        fields.push(renderField('reps', 'Reps per Set', 'number', 1));
        
        // Distance and Height fields (both optional and independently editable)
        fields.push(
          <div key="distance-height" className="grid grid-cols-2 gap-4">
            {renderField('distance', 'Distance (meters)', 'number', 0, 0.1)}
            {renderField('height', 'Height (cm)', 'number', 0, 1)}
          </div>
        );
        
        fields.push(renderField('restTime', 'Rest Between Sets (seconds)', 'number', 0));
        break;
        break;      case 'other':
      default:
        fields.push(renderField('duration', 'Duration (minutes) *', 'number', 0.1, 0.1));
        fields.push(renderField('distance', 'Distance (km)', 'number', 0, 0.1));
        fields.push(renderField('calories', 'Calories', 'number', 0));
        break;
    }

    // RPE field for most exercise types
    if (!['flexibility', 'strength', 'bodyweight'].includes(exerciseType)) {
      fields.push(
        <div key="rpe" className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            RPE (Rate of Perceived Exertion)
            <button
              type="button"
              onClick={() => setShowRPEHelper(!showRPEHelper)}
              className="ml-1 text-blue-400 hover:text-blue-300"
            >
              ?
            </button>
          </label>
          <select
            value={sets[setIndex]?.rpe !== undefined ? sets[setIndex].rpe : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                updateSet(setIndex, 'rpe', undefined);
              } else {
                updateSet(setIndex, 'rpe', parseInt(value));
              }
            }}
            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Select RPE</option>
            {Object.entries(RPE_SCALE).map(([value, { label }]) => (
              <option key={value} value={value}>
                {value} - {label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Notes field
    fields.push(
      <div key="notes" className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">Notes</label>
        <textarea
          value={sets[setIndex]?.notes || ''}
          onChange={(e) => {
            e.stopPropagation();
            const value = e.target.value;
            updateSet(setIndex, 'notes', value);
          }}
          onFocus={(e) => e.stopPropagation()}
          className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          rows={2}
          placeholder="Optional notes about this set..."
        />
      </div>
    );

    return fields;
  }, [sets, updateSet]);

  const getSetLabel = () => {
    switch (exerciseType) {
      case 'sport':
      case 'flexibility':
        return 'Set';
      default:
        return 'Set';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {isEditing ? 'Edit' : 'Log'} {exercise.name}
          </h2>
          <div className="text-xs sm:text-sm text-gray-400">
            {sets.length} {getSetLabel()}{sets.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-400 mt-1">
          {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise
        </div>
      </div>

      {/* Sets List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {sets.map((_, index) => (
          <div key={setIds[index] || `set-${index}`} className="bg-[#1a1a1a] rounded-lg p-3 sm:p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-white">
                {getSetLabel()} {index + 1}
              </h3>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    onClick={() => copyPreviousSet(index)}
                    className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors touch-manipulation"
                  >
                    Copy Previous
                  </button>
                )}
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(index)}
                    className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors touch-manipulation"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {renderFieldsForSet(index)}
            </div>
          </div>
        ))}

        {/* Add Set Button */}
        <button
          onClick={addSet}
          className="w-full py-3 sm:py-4 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-medium transition-colors border-2 border-dashed border-white/20 touch-manipulation"
        >
          + Add {getSetLabel()}
        </button>
      </div>

      {/* RPE Helper Modal */}
      {showRPEHelper && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">RPE Scale Reference</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(RPE_SCALE).map(([value, { label, description }]) => (
                <div key={value} className="flex justify-between items-center py-1">
                  <span className="text-white font-medium">{value} - {label}</span>
                  <span className="text-gray-400 text-sm">{description}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRPEHelper(false)}
              className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation text-base"
          >
            {isEditing ? 'Update' : 'Save'} {getSetLabel()}{sets.length !== 1 ? 's' : ''}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalSetLogger;
