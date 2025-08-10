import React, { useState, useEffect, useCallback } from 'react';
import { ExerciseSet } from '../types/sets';
import { Exercise } from '../types/exercise';
import { ExerciseType, getExerciseTypeConfig, STRETCH_TYPES, RPE_SCALE, RIR_SCALE, HR_ZONES } from '../config/exerciseTypes';
import { validateExerciseSet, getDefaultSetForType, formatValidationErrors } from '../utils/exerciseValidation';

interface DynamicExerciseSetLoggerProps {
  exercise: Exercise;
  exerciseType: ExerciseType;
  onSave: (sets: ExerciseSet[]) => void;
  onCancel: () => void;
  initialSets?: ExerciseSet[];
  isEditing?: boolean;
}

const DynamicExerciseSetLogger: React.FC<DynamicExerciseSetLoggerProps> = ({
  exercise,
  exerciseType,
  onSave,
  onCancel,
  initialSets = [],
  isEditing = false
}) => {
  const config = getExerciseTypeConfig(exerciseType);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [showRPEHelper, setShowRPEHelper] = useState(false);
  const [showRIRHelper, setShowRIRHelper] = useState(false);

  console.log('🎯 DynamicExerciseSetLogger: Initialized for exercise:', exercise.name, {
    exerciseType,
    config: config.displayName,
    requiredStats: config.requiredStats,
    optionalStats: config.optionalStats,
    initialSets: initialSets.length
  });

  // Initialize sets
  useEffect(() => {
    if (initialSets.length > 0) {
      setSets(initialSets);
    } else {
      // Create one default set
      const defaultSet = getDefaultSetForType(exerciseType);
      setSets([defaultSet as ExerciseSet]);
    }
  }, [initialSets, exerciseType]);

  const addSet = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    const newSet = lastSet ? { ...lastSet } : getDefaultSetForType(exerciseType);
    setSets(prev => [...prev, newSet as ExerciseSet]);
  }, [sets, exerciseType]);

  const removeSet = useCallback((index: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  }, [sets.length]);

  const updateSet = useCallback((index: number, field: keyof ExerciseSet, value: any) => {
    setSets(prev => {
      const newSets = [...prev];
      newSets[index] = { ...newSets[index], [field]: value };
      return newSets;
    });

    // Clear validation error for this set when user starts typing
    setValidationErrors(prev => {
      if (prev[index]) {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const validateAndSave = useCallback(() => {
    const errors: Record<number, string> = {};
    let hasErrors = false;

    sets.forEach((set, index) => {
      const validation = validateExerciseSet(set, exerciseType);
      if (!validation.isValid) {
        errors[index] = formatValidationErrors(validation);
        hasErrors = true;
      }
    });

    setValidationErrors(errors);

    if (!hasErrors) {
      onSave(sets);
    }
  }, [sets, exerciseType, onSave]);

  const renderField = (setIndex: number, field: keyof ExerciseSet, label: string, type: 'number' | 'text' | 'select' = 'number', options?: string[]) => {
    const set = sets[setIndex];
    const value = set[field];
    const isRequired = config.requiredStats.includes(field);

    if (type === 'select' && options) {
      return (
        <div key={field} className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <select
            value={value as string || ''}
            onChange={(e) => updateSet(setIndex, field, e.target.value)}
            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field} className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">
          {label} {isRequired && <span className="text-red-400">*</span>}
        </label>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => updateSet(setIndex, field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6]"
          placeholder={type === 'number' ? '0' : `Enter ${label.toLowerCase()}`}
          min={type === 'number' ? 0 : undefined}
          step={field === 'weight' ? 0.5 : field === 'distance' ? 0.1 : 1}
        />
      </div>
    );
  };

  const renderSetFields = (setIndex: number) => {
    const fields: JSX.Element[] = [];

    // Render fields based on exercise type
    switch (exerciseType) {
      case 'strength':
        fields.push(renderField(setIndex, 'sets', 'Sets'));
        fields.push(renderField(setIndex, 'reps', 'Reps'));
        fields.push(renderField(setIndex, 'weight', 'Weight (kg)'));
        fields.push(
          <div key="rir" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              RIR (Reps in Reserve) <span className="text-red-400">*</span>
              <button
                type="button"
                onClick={() => setShowRIRHelper(!showRIRHelper)}
                className="ml-1 text-blue-400 hover:text-blue-300"
              >
                ?
              </button>
            </label>
            <select
              value={sets[setIndex].rir || ''}
              onChange={(e) => updateSet(setIndex, 'rir', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">Select RIR</option>
              {Object.entries(RIR_SCALE).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        );
        fields.push(renderField(setIndex, 'restTime', 'Rest Time (seconds)'));
        break;

      case 'plyometrics':
        fields.push(renderField(setIndex, 'sets', 'Sets'));
        fields.push(renderField(setIndex, 'reps', 'Reps'));
        fields.push(renderField(setIndex, 'height', 'Height/Distance (cm)'));
        fields.push(
          <div key="rpe" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              RPE (Rate of Perceived Exertion) <span className="text-red-400">*</span>
              <button
                type="button"
                onClick={() => setShowRPEHelper(!showRPEHelper)}
                className="ml-1 text-blue-400 hover:text-blue-300"
              >
                ?
              </button>
            </label>
            <select
              value={sets[setIndex].rpe || ''}
              onChange={(e) => updateSet(setIndex, 'rpe', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">Select RPE</option>
              {Object.entries(RPE_SCALE).map(([value, { label }]) => (
                <option key={value} value={value}>{value} - {label}</option>
              ))}
            </select>
          </div>
        );
        fields.push(renderField(setIndex, 'restTime', 'Rest Time (seconds)'));
        break;

      case 'endurance':
      case 'teamSports':
      case 'other':
        fields.push(renderField(setIndex, 'duration', 'Duration (minutes)'));
        fields.push(renderField(setIndex, 'distance', 'Distance (km)'));
        fields.push(
          <div key="rpe" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              RPE (Rate of Perceived Exertion) <span className="text-red-400">*</span>
              <button
                type="button"
                onClick={() => setShowRPEHelper(!showRPEHelper)}
                className="ml-1 text-blue-400 hover:text-blue-300"
              >
                ?
              </button>
            </label>
            <select
              value={sets[setIndex].rpe || ''}
              onChange={(e) => updateSet(setIndex, 'rpe', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">Select RPE</option>
              {Object.entries(RPE_SCALE).map(([value, { label }]) => (
                <option key={value} value={value}>{value} - {label}</option>
              ))}
            </select>
          </div>
        );
        
        // HR Zones
        fields.push(
          <div key="hr-zones" className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Heart Rate Zones (minutes)</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(HR_ZONES).map(([zone, { name }]) => (
                <div key={zone} className="space-y-1">
                  <label className="block text-xs text-gray-400">{name}</label>
                  <input
                    type="number"
                    value={sets[setIndex][zone as keyof ExerciseSet] || ''}
                    onChange={(e) => updateSet(setIndex, zone as keyof ExerciseSet, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case 'flexibility':
        fields.push(renderField(setIndex, 'duration', 'Duration (minutes)'));
        fields.push(renderField(setIndex, 'stretchType', 'Stretch Type', 'select', STRETCH_TYPES));
        fields.push(renderField(setIndex, 'intensity', 'Intensity (1-10)'));
        break;
    }

    // Add notes field for all types
    fields.push(renderField(setIndex, 'notes', 'Notes', 'text'));

    return fields;
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medium text-white">{exercise.name}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {config.displayName} • {config.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs text-white ${config.color}`}>
              {config.icon} {config.displayName}
            </span>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Helper Modals */}
      {showRPEHelper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRPEHelper(false)}>
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">RPE Scale (Rate of Perceived Exertion)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(RPE_SCALE).map(([value, { label, description }]) => (
                <div key={value} className="flex justify-between text-sm">
                  <span className="text-white">{value} - {label}</span>
                  <span className="text-gray-400">{description}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRPEHelper(false)}
              className="mt-4 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRIRHelper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRIRHelper(false)}>
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">RIR Scale (Reps in Reserve)</h3>
            <div className="space-y-2">
              {Object.entries(RIR_SCALE).map(([value, { label, description }]) => (
                <div key={value} className="flex justify-between text-sm">
                  <span className="text-white">{label}</span>
                  <span className="text-gray-400">{description}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRIRHelper(false)}
              className="mt-4 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {sets.map((_, index) => (
            <div key={index} className="border border-white/10 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  {exerciseType === 'strength' || exerciseType === 'plyometrics' ? `Set ${index + 1}` : `Session ${index + 1}`}
                </h3>
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {validationErrors[index] && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm whitespace-pre-line">{validationErrors[index]}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderSetFields(index)}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addSet}
          className="mt-4 w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-white/40 hover:text-white transition-colors"
        >
          + Add {exerciseType === 'strength' || exerciseType === 'plyometrics' ? 'Set' : 'Session'}
        </button>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={validateAndSave}
            className="px-6 py-3 bg-[#8B5CF6] text-white rounded-xl hover:bg-[#7C3AED] transition-colors"
          >
            {isEditing ? 'Update' : 'Save'} {config.displayName}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicExerciseSetLogger;
