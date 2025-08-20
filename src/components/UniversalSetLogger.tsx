import React, { useState, useEffect } from 'react';
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
        weight: 20,
        reps: 10,
        rpe: 5
      };

    case 'endurance':
      return {
        ...baseSet,
        weight: 0,
        reps: 1,
        duration: 30, // minutes
        distance: 5, // km
        rpe: 6,
        hrZone1: 0,
        hrZone2: 5,
        hrZone3: 20,
        hrZone4: 5,
        hrZone5: 0
      };

    case 'flexibility':
      return {
        ...baseSet,
        weight: 0,
        reps: 1,
        duration: 2, // minutes
        holdTime: 30, // seconds
        intensity: 5
      };

    case 'sport':
      return {
        ...baseSet,
        weight: 0,
        reps: 1,
        duration: 60, // minutes
        rpe: 7,
        calories: 300
      };

    case 'speed_agility':
      return {
        ...baseSet,
        weight: 0,
        reps: 10,
        sets: 3,
        duration: 1, // minutes per set
        height: 30 // cm for jumps
      };

    case 'other':
    default:
      return {
        ...baseSet,
        weight: 0,
        reps: 1,
        duration: 30, // minutes
        rpe: 5
      };
  }
};

export const UniversalSetLogger: React.FC<UniversalSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  initialSets = [],
}) => {
  const exerciseType = getExerciseType(exercise);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [showRPEHelper, setShowRPEHelper] = useState(false);

  // Initialize sets
  useEffect(() => {
    if (initialSets.length > 0) {
      setSets(initialSets);
    } else {
      setSets([getDefaultSet(exerciseType)]);
    }
  }, [initialSets, exerciseType]);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet = lastSet ? { ...lastSet } : getDefaultSet(exerciseType);
    setSets(prev => [...prev, newSet]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: any) => {
    setSets(prev => {
      const newSets = [...prev];
      newSets[index] = { ...newSets[index], [field]: value };
      return newSets;
    });
  };

  const copyPreviousSet = (index: number) => {
    if (index > 0) {
      const previousSet = sets[index - 1];
      setSets(prev => {
        const newSets = [...prev];
        newSets[index] = { ...previousSet };
        return newSets;
      });
      toast.success('Copied previous set values');
    }
  };

  const handleSave = () => {
    // Validate that we have at least one set with some data
    const validSets = sets.filter(set => {
      switch (exerciseType) {
        case 'strength':
        case 'bodyweight':
          return set.weight > 0 && set.reps > 0;
        case 'endurance':
        case 'sport':
        case 'other':
          return (set.duration && set.duration > 0) || (set.distance && set.distance > 0);
        case 'flexibility':
          return set.duration && set.duration > 0;
        case 'speed_agility':
          return set.reps > 0;
        default:
          return true;
      }
    });

    if (validSets.length === 0) {
      toast.error('Please fill in at least one complete set');
      return;
    }

    onSave(validSets);
  };

  const renderFieldsForSet = (setIndex: number) => {
    const set = sets[setIndex];
    const fields: React.ReactNode[] = [];

    // Common function to render input field
    const renderField = (
      field: keyof ExerciseSet,
      label: string,
      type: 'number' | 'text' = 'number',
      min?: number,
      step?: number,
      placeholder?: string
    ) => (
      <div key={field} className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <input
          type={type}
          value={set[field] as string || ''}
          onChange={(e) => updateSet(setIndex, field, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
          min={min}
          step={step}
          placeholder={placeholder}
        />
      </div>
    );

    // Render fields based on exercise type
    switch (exerciseType) {
      case 'strength':
      case 'bodyweight':
        fields.push(
          <div key="sets-reps" className="grid grid-cols-2 gap-4">
            {renderField('reps', 'Reps *', 'number', 1)}
            {renderField('weight', 'Weight (kg)', 'number', 0, 0.5)}
          </div>
        );
        fields.push(renderField('rir', 'RIR (Reps in Reserve)', 'number', 0, 1));
        fields.push(renderField('restTime', 'Rest Time (seconds)', 'number', 0));
        break;

      case 'endurance':
        fields.push(
          <div key="duration-distance" className="grid grid-cols-2 gap-4">
            {renderField('duration', 'Duration (minutes) *', 'number', 0.1, 0.1)}
            {renderField('distance', 'Distance (km)', 'number', 0, 0.1)}
          </div>
        );
        fields.push(renderField('calories', 'Calories', 'number', 0));
        fields.push(renderField('averageHeartRate', 'Average Heart Rate', 'number', 40, 1));
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
            </div>
          </div>
        );
        break;

      case 'flexibility':
        fields.push(renderField('duration', 'Duration (minutes) *', 'number', 0.1, 0.1));
        fields.push(renderField('holdTime', 'Hold Time (seconds)', 'number', 1));
        fields.push(renderField('intensity', 'Intensity (1-10)', 'number', 1, 1));
        fields.push(renderField('stretchType', 'Stretch Type', 'text', undefined, undefined, 'e.g., Static, Dynamic'));
        break;

      case 'sport':
        fields.push(renderField('duration', 'Duration (minutes) *', 'number', 1));
        fields.push(renderField('distance', 'Distance (km)', 'number', 0, 0.1));
        fields.push(renderField('calories', 'Calories', 'number', 0));
        fields.push(renderField('score', 'Score/Result', 'text', undefined, undefined, 'e.g., 2-1, Personal best'));
        fields.push(renderField('opponent', 'Opponent/Team', 'text', undefined, undefined, 'Optional'));
        break;

      case 'speed_agility':
        fields.push(
          <div key="sets-reps" className="grid grid-cols-2 gap-4">
            {renderField('sets', 'Sets', 'number', 1)}
            {renderField('reps', 'Reps per Set', 'number', 1)}
          </div>
        );
        fields.push(renderField('duration', 'Duration per Set (min)', 'number', 0.1, 0.1));
        fields.push(renderField('height', 'Height/Distance (cm)', 'number', 0));
        fields.push(renderField('restTime', 'Rest Between Sets (sec)', 'number', 0));
        break;

      case 'other':
      default:
        fields.push(renderField('duration', 'Duration (minutes) *', 'number', 0.1, 0.1));
        fields.push(renderField('distance', 'Distance (km)', 'number', 0, 0.1));
        fields.push(renderField('calories', 'Calories', 'number', 0));
        break;
    }

    // RPE field for most exercise types
    if (!['flexibility'].includes(exerciseType)) {
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
            value={set.rpe || ''}
            onChange={(e) => updateSet(setIndex, 'rpe', parseInt(e.target.value))}
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
          value={set.notes || ''}
          onChange={(e) => updateSet(setIndex, 'notes', e.target.value)}
          className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
          rows={2}
          placeholder="Optional notes about this set..."
        />
      </div>
    );

    return fields;
  };

  const getSetLabel = () => {
    switch (exerciseType) {
      case 'endurance':
      case 'sport':
      case 'flexibility':
        return 'Session';
      default:
        return 'Set';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
          <div className="text-sm text-gray-400">
            {sets.length} {getSetLabel()}{sets.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise
        </div>
      </div>

      {/* Sets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sets.map((_, index) => (
          <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                {getSetLabel()} {index + 1}
              </h3>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    onClick={() => copyPreviousSet(index)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Copy Previous
                  </button>
                )}
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(index)}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldsForSet(index)}
            </div>
          </div>
        ))}

        {/* Add Set Button */}
        <button
          onClick={addSet}
          className="w-full py-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border-2 border-dashed border-white/20"
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
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
          >
            Save {getSetLabel()}{sets.length !== 1 ? 's' : ''}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalSetLogger;
