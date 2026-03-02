import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Exercise } from '@/types/exercise';
import type { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { DifficultyCategory } from '@/types/difficulty';
import { toast } from 'react-hot-toast';
import { SwipeableSetRow } from './SwipeableSetRow';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import { ExerciseHistorySummary } from './ExerciseHistorySummary';
import { Prescription } from '@/types/program';
import { prescriptionToSets } from '@/utils/prescriptionUtils';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';
import {
  fromMinutesSeconds,
  formatDurationSeconds,
  hasEssentialFields,
  toMinutesSeconds,
} from '@/utils/activityFieldContract';
import PrescriptionGuideCard from '@/components/exercises/PrescriptionGuideCard';
import { ExercisePrescriptionAssistantData } from '@/types/exercise';
import { generateExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface UniversalSetLoggerProps {
  exercise: Exercise;
  onSave: (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void;
  onCancel: () => void;
  initialSets?: ExerciseSet[];
  isEditing?: boolean;
  prescription?: Prescription; // Prescription data from program
  instructionMode?: 'structured' | 'freeform'; // Instruction mode from program
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
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
  const activityType = resolveActivityTypeFromExerciseLike(exercise, { fallback: ActivityType.RESISTANCE });
  switch (activityType) {
    case ActivityType.RESISTANCE:
      return 'strength';
    case ActivityType.ENDURANCE:
      return 'endurance';
    case ActivityType.STRETCHING:
      return 'flexibility';
    case ActivityType.SPORT:
      return 'sport';
    case ActivityType.SPEED_AGILITY:
      return 'speed_agility';
    case ActivityType.OTHER:
    default:
      return 'other';
  }
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
        duration: 0,
        distance: 0,
        rpe: 0,
        averageHeartRate: 0,
        calories: 0,
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
        duration: 0,
        distance: 0,
        rpe: 0,
        calories: 0,
        performance: ''
      };

    case 'speed_agility':
      return {
        ...baseSet,
        reps: 5,
        distance: 0,
        restTime: 0,
        rpe: 0
      };

    case 'other':
    default:
      return {
        ...baseSet,
        duration: 0,
        distance: 0,
        rpe: 0
      };
  }
};

const estimateOneRepMax = (sets: ExerciseSet[]): number | undefined => {
  const candidates = sets
    .filter((set) => set.weight > 0 && set.reps > 0)
    .map((set) => set.weight * (1 + set.reps / 30));

  if (candidates.length === 0) {
    return undefined;
  }

  return Math.round(Math.max(...candidates) * 2) / 2;
};

export const UniversalSetLogger: React.FC<UniversalSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  initialSets = [],
  isEditing = false,
  prescription,
  instructionMode,
  prescriptionAssistant,
}) => {
  const exerciseType = getExerciseType(exercise);
  const exerciseActivityType = resolveActivityTypeFromExerciseLike(exercise, { fallback: ActivityType.RESISTANCE });
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Prescription state
  const [followPrescription, setFollowPrescription] = useState<boolean>(true);
  const [showPrescriptionGuide, setShowPrescriptionGuide] = useState(false);
  const [showRecentHistory, setShowRecentHistory] = useState(false);
  const prescriptionApplied = false;
  
  // Fetch exercise history for progressive overload context
  const exerciseHistory = useExerciseHistory(exercise.name);
  const [showRPEHelper, setShowRPEHelper] = useState(false);
  const [expandedSetIndex, setExpandedSetIndex] = useState<number | null>(null);
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const [assistantSuggestion, setAssistantSuggestion] = useState<ExercisePrescriptionAssistantData | undefined>(prescriptionAssistant || exercise.prescriptionAssistant);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const generatedAssistantRef = useRef(Boolean(prescriptionAssistant || exercise.prescriptionAssistant));
  
  // Track unique IDs for sets to prevent key issues
  const [setIds, setSetIds] = useState<string[]>([]);
  
  // Ref for scrolling to new sets
  const setListRef = useRef<HTMLDivElement>(null);

  // Check if exercise has instructions from program prescription
  const hasInstructions = exercise.instructions && exercise.instructions.length > 0;
  const instructionsText = hasInstructions 
    ? (Array.isArray(exercise.instructions) ? exercise.instructions[0] : exercise.instructions)
    : null;

  // Check if exercise has prescription from program
  const hasPrescription = prescription && instructionMode === 'structured';

  const prescriptionTargetSets = useMemo(() => {
    if (!hasPrescription || !prescription) {
      return [] as ExerciseSet[];
    }

    try {
      return prescriptionToSets(
        prescription,
        normalizeActivityType(exercise.activityType)
      );
    } catch {
      return [] as ExerciseSet[];
    }
  }, [hasPrescription, prescription, exercise.activityType]);

  useEffect(() => {
    if (prescriptionAssistant || exercise.prescriptionAssistant) {
      setAssistantSuggestion(prescriptionAssistant || exercise.prescriptionAssistant);
      generatedAssistantRef.current = true;
    }
  }, [prescriptionAssistant, exercise.prescriptionAssistant]);

  useEffect(() => {
    if (!hasPrescription || isEditing || generatedAssistantRef.current || !user?.id) {
      return;
    }

    let cancelled = false;
    generatedAssistantRef.current = true;

    const generateSuggestion = async () => {
      try {
        setAssistantLoading(true);
        const estimatedOneRepMax = estimateOneRepMax(exerciseHistory.history.flatMap((entry) => entry.sets));
        const typicalRPEValues = exerciseHistory.history
          .flatMap((entry) => entry.sets)
          .map((set) => set.rpe)
          .filter((value): value is number => typeof value === 'number');

        const typicalRPE = typicalRPEValues.length > 0
          ? typicalRPEValues.reduce((sum, value) => sum + value, 0) / typicalRPEValues.length
          : undefined;

        const generated = await generateExercisePrescriptionAssistant({
          exercise: {
            id: exercise.id,
            name: exercise.name,
            activityType: exercise.activityType,
            prescription,
          },
          userId: user.id,
          userContext: {
            oneRepMax: estimatedOneRepMax,
            typicalRPE,
          },
          sessionContext: {
            date: new Date().toISOString().slice(0, 10),
            warmupDone: true,
          },
        });

        if (!cancelled) {
          setAssistantSuggestion(generated);
        }
      } catch (error) {
        console.warn('Could not generate prescription assistant output:', error);
      } finally {
        if (!cancelled) {
          setAssistantLoading(false);
        }
      }
    };

    generateSuggestion();

    return () => {
      cancelled = true;
    };
  }, [hasPrescription, isEditing, user?.id, exercise.id, exercise.name, exercise.activityType, prescription, exerciseHistory.history]);

  // Initialize sets without auto-prefill to keep first-set editing flow fast
  useEffect(() => {
    if (initialSets && initialSets.length > 0) {
      // Editing existing exercise - use provided sets
      const clonedSets = initialSets.map(set => ({ ...set }));
      setSets(clonedSets);
      const ids = clonedSets.map((_, index) => `set-${exercise.name}-${index}-${Date.now()}`);
      setSetIds(ids);
    } else {
      // Always start with a single editable set
      const defaultSet = getDefaultSet(exerciseType);
      setSets([defaultSet]);
      setSetIds([`set-${exercise.name}-0-${Date.now()}`]);
    }
  }, [initialSets, exerciseType, exercise.name, isEditing]);

  const addSet = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    const newSet = lastSet ? { ...lastSet } : getDefaultSet(exerciseType);
    const newId = `set-${exercise.name}-${sets.length}-${Date.now()}`;
    const newIndex = sets.length;
    
    setSets(prev => [...prev, newSet]);
    setSetIds(prev => [...prev, newId]);
    setLastAddedIndex(newIndex);
    setExpandedSetIndex(newIndex); // Expand the newly added set for editing
    
    // Show toast notification
    toast.success(`Set ${newIndex + 1} added`, {
      duration: 1500,
      icon: '✓',
      style: {
        background: '#2a2a2a',
        color: '#fff',
        border: '1px solid rgba(139, 92, 246, 0.5)',
      },
    });
    
    // Scroll to the new set after a short delay
    setTimeout(() => {
      if (setListRef.current) {
        setListRef.current.scrollTo({
          top: setListRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
    
    // Clear animation state after animation completes
    setTimeout(() => {
      setLastAddedIndex(null);
    }, 600);
  }, [sets, exerciseType, exercise.name]);

  const removeSet = useCallback((index: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
      setSetIds(prev => prev.filter((_, i) => i !== index));
      
      // Adjust expanded set index if needed
      if (expandedSetIndex !== null) {
        if (expandedSetIndex === index) {
          setExpandedSetIndex(null);
        } else if (expandedSetIndex > index) {
          setExpandedSetIndex(expandedSetIndex - 1);
        }
      }
      
      toast.success(`Set ${index + 1} removed`, {
        duration: 1500,
        icon: '🗑️',
        style: {
          background: '#2a2a2a',
          color: '#fff',
        },
      });
    } else {
      toast.error('Cannot remove the last set', {
        duration: 1500,
      });
    }
  }, [sets.length, expandedSetIndex]);

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

  // Handle copying last values from exercise history
  const handleCopyLastHistoryValues = useCallback((historySets: ExerciseSet[]) => {
    if (historySets.length > 0) {
      // Replace current sets with history sets
      setSets(historySets);
      // Generate new IDs for the copied sets
      const newIds = historySets.map((_, index) => `set-${exercise.name}-${index}-${Date.now()}`);
      setSetIds(newIds);
      toast.success(`Copied ${historySets.length} set${historySets.length > 1 ? 's' : ''} from last session`, {
        duration: 2000,
        icon: '📋',
      });
    }
  }, [exercise.name]);

  // Toggle prescription pre-filling
  const handleTogglePrescription = useCallback(() => {
    const newValue = !followPrescription;
    setFollowPrescription(newValue);

    if (!newValue) {
      toast('Prescription mode disabled. Modify sets as needed.', { 
        duration: 2000,
        icon: 'ℹ️' 
      });
    }
  }, [followPrescription]);

  const handleSave = () => {
    const validSets = sets.filter(set => {
      switch (exerciseType) {
        case 'strength':
        case 'bodyweight':
          return set.reps > 0;
        case 'endurance':
        case 'sport':
        case 'flexibility':
        case 'speed_agility':
        case 'other':
          return hasEssentialFields(set, exerciseActivityType);
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

    onSave(validSets, { prescriptionAssistant: assistantSuggestion });
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
              className="resistance-input resistance-input-control flex-1 min-w-0 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-center focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
              inputMode={step && step < 1 ? 'decimal' : 'numeric'}
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

    const renderDurationField = () => {
      const duration = toMinutesSeconds(sets[setIndex]?.duration);

      return (
        <div key="duration-min-sec" className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">Duration Minutes *</label>
            <input
              type="number"
              value={duration.minutes}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={(event) => {
                const nextMinutes = Math.max(0, Number(event.target.value) || 0);
                const nextDuration = fromMinutesSeconds(nextMinutes, duration.seconds);
                updateSet(setIndex, 'duration', nextDuration);
              }}
              className="resistance-input resistance-input-control w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-center focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">Duration Seconds *</label>
            <input
              type="number"
              value={duration.seconds}
              min={0}
              max={59}
              step={1}
              inputMode="numeric"
              onChange={(event) => {
                const inputSeconds = Math.max(0, Math.min(59, Number(event.target.value) || 0));
                const nextDuration = fromMinutesSeconds(duration.minutes, inputSeconds);
                updateSet(setIndex, 'duration', nextDuration);
              }}
              className="resistance-input resistance-input-control w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-center focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
              placeholder="0"
            />
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
            {renderField('reps', 'Reps *', 'number', 1, 1, '1-999', true)}
            {renderField('weight', 'Weight (kg)', 'number', 0, 0.5, '0-999.9', true)}
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
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
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
        fields.push(renderDurationField());
        fields.push(renderField('distance', 'Distance (m)', 'number', 0, 1, '0-100000'));
        fields.push(renderField('rpe', 'RPE', 'number', 1, 1, '1-10'));
        fields.push(renderField('calories', 'Calories', 'number', 0, 1, '0-9999'));
        fields.push(renderField('averageHeartRate', 'Average HR (bpm)', 'number', 40, 1, '40-250'));
        break;

      case 'flexibility':
        fields.push(renderField('holdTime', 'Hold Time (seconds) *', 'number', 1, 1, '1-600'));
        fields.push(
          <div key="intensity" className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">Intensity</label>
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
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
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
        break;

      case 'sport':
        fields.push(renderDurationField());
        fields.push(renderField('distance', 'Distance (m)', 'number', 0, 1, '0-100000'));
        fields.push(renderField('rpe', 'RPE', 'number', 1, 1, '1-10'));
        fields.push(renderField('calories', 'Calories', 'number', 0, 1, '0-9999'));
        fields.push(renderField('performance', 'Performance Rating (1-10)', 'number', 1, 1, '1-10'));
        break;

      case 'speed_agility':
        fields.push(renderField('reps', 'Reps per Set', 'number', 1, 1, '1-999'));
        fields.push(renderField('distance', 'Distance (m)', 'number', 0, 1, '0-1000'));
        fields.push(renderField('restTime', 'Rest Between Sets (seconds)', 'number', 0, 1, '0-600'));
        fields.push(renderField('rpe', 'RPE', 'number', 1, 1, '1-10'));
        break;

      case 'other':
      default:
        fields.push(renderDurationField());
        fields.push(renderField('distance', 'Distance (m)', 'number', 0, 1, '0-100000'));
        fields.push(renderField('rpe', 'RPE', 'number', 1, 1, '1-10'));
        fields.push(renderField('calories', 'Calories', 'number', 0, 1, '0-9999'));
        break;
    }

    if (!['strength', 'bodyweight'].includes(exerciseType)) {
      fields.push(
        <button
          key="rpe-helper"
          type="button"
          onClick={() => setShowRPEHelper(!showRPEHelper)}
          className="w-full text-left text-xs text-blue-400 hover:text-blue-300"
        >
          View RPE scale reference
        </button>
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
          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
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

  const getInlineTargetText = (index: number) => {
    if (!followPrescription) {
      return null;
    }

    if (assistantSuggestion?.suggestedPrescription?.length) {
      const suggestedSet = assistantSuggestion.suggestedPrescription[
        Math.min(index, assistantSuggestion.suggestedPrescription.length - 1)
      ];

      if (suggestedSet) {
        switch (exerciseType) {
          case 'strength':
          case 'bodyweight':
            return `Target ${suggestedSet.targetLoad || 'bodyweight'} × ${suggestedSet.targetReps || 0}`;
          case 'endurance':
          case 'sport':
            return `Target ${suggestedSet.targetDuration || 0} min${suggestedSet.targetDistance ? ` • ${suggestedSet.targetDistance} km` : ''}`;
          case 'flexibility':
            return `Target ${suggestedSet.targetDuration || 0}s hold${suggestedSet.targetReps ? ` × ${suggestedSet.targetReps}` : ''}`;
          case 'speed_agility':
            return `Target ${suggestedSet.targetReps || 0} reps${suggestedSet.targetDistance ? ` • ${suggestedSet.targetDistance}m` : ''}`;
          default:
            return `Target ${suggestedSet.targetDuration || 0} min`;
        }
      }
    }

    if (prescriptionTargetSets.length === 0) {
      return null;
    }

    const safeIndex = Math.min(index, prescriptionTargetSets.length - 1);
    const targetSet = prescriptionTargetSets[safeIndex];
    if (!targetSet) {
      return null;
    }

    switch (exerciseType) {
      case 'strength':
      case 'bodyweight':
        return `Target ${targetSet.weight || 0}kg × ${targetSet.reps || 0}`;
      case 'endurance':
      case 'sport':
        return `Target ${targetSet.duration || 0} min${targetSet.distance ? ` • ${targetSet.distance} km` : ''}`;
      case 'flexibility':
        return `Target ${targetSet.holdTime || targetSet.duration || 0}s hold${targetSet.reps ? ` × ${targetSet.reps}` : ''}`;
      case 'speed_agility':
        return `Target ${targetSet.reps || 0} reps${targetSet.distance ? ` • ${targetSet.distance}m` : ''}`;
      default:
        return `Target ${targetSet.duration || 0} min`;
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

        <div className="mt-3 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setShowPrescriptionGuide((current) => !current)}
            className="w-full flex items-center justify-between px-3 py-2 mb-2 rounded-lg border border-primary-700/40 bg-bg-tertiary/60 text-left"
            aria-expanded={showPrescriptionGuide}
            aria-controls="universal-prescription-guide-section"
          >
            <span className="text-sm font-semibold text-primary-300">Prescription Guide</span>
            <span className="text-xs text-text-tertiary flex items-center gap-2">
              {showPrescriptionGuide ? 'Hide' : 'Show'}
              <svg
                className={`w-4 h-4 transition-transform ${showPrescriptionGuide ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>

          {showPrescriptionGuide && (
            <div id="universal-prescription-guide-section">
              <PrescriptionGuideCard
                activityType={normalizeActivityType(exercise.activityType)}
                prescription={prescription}
                instructionMode={instructionMode}
                instructionsText={instructionsText}
                isEditing={isEditing}
                followPrescription={followPrescription}
                prescriptionApplied={prescriptionApplied}
                onToggleFollow={!isEditing && hasPrescription ? handleTogglePrescription : undefined}
                uiHint={assistantSuggestion?.uiHint}
                warnings={assistantSuggestion?.warnings}
                alternatives={assistantSuggestion?.alternatives}
                progressionNote={assistantSuggestion?.progressionNote}
              />
            </div>
          )}
        </div>

        {assistantLoading && (
          <p className="mt-2 text-xs text-primary-300">Generating prescription guidance...</p>
        )}
        
        {/* Exercise History Summary - helps with progressive overload */}
        {!isEditing && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowRecentHistory((current) => !current)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-left"
              aria-expanded={showRecentHistory}
              aria-controls="universal-recent-history-section"
            >
              <span className="text-sm font-semibold text-text-primary">Recent history</span>
              <span className="text-xs text-text-tertiary flex items-center gap-2">
                {showRecentHistory ? 'Hide' : 'Show'}
                <svg
                  className={`w-4 h-4 transition-transform ${showRecentHistory ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {showRecentHistory && (
              <div id="universal-recent-history-section" className="mt-2">
                <ExerciseHistorySummary
                  exerciseName={exercise.name}
                  historyData={exerciseHistory}
                  onCopyLastValues={handleCopyLastHistoryValues}
                  compact={false}
                />
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sets List */}
      <div ref={setListRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {sets.map((set, index) => {
          const isExpanded = expandedSetIndex === index;
          const isNewlyAdded = lastAddedIndex === index;
          
          return (
            <SwipeableSetRow
              key={setIds[index] || `set-${index}`}
              onDelete={() => removeSet(index)}
              disabled={sets.length <= 1}
            >
              <div 
                className={`
                  bg-bg-primary rounded-lg border border-border overflow-hidden
                  ${isNewlyAdded ? 'set-added-animation' : ''}
                `}
              >
                {/* Collapsed/Summary View - always visible */}
                <div 
                  className={`
                    flex items-center justify-between p-3 sm:p-4 cursor-pointer 
                    hover:bg-white/5 transition-colors
                    ${isExpanded ? 'border-b border-white/10' : ''}
                  `}
                  onClick={() => setExpandedSetIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-gray-400 font-medium shrink-0">
                      {getSetLabel()} {index + 1}
                    </span>
                    {getInlineTargetText(index) && (
                      <span className="text-[11px] text-primary-300 bg-primary-900/20 border border-primary-700/40 rounded px-2 py-0.5">
                        {getInlineTargetText(index)}
                      </span>
                    )}
                    
                    {/* Compact set summary based on exercise type */}
                    {!isExpanded && (
                      <div className="flex items-center gap-2 text-text-primary font-medium truncate">
                        {exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                          <span>{set.weight || 0}kg × {set.reps || 0}</span>
                        ) : exerciseType === 'endurance' ? (
                          <span>
                              {formatDurationSeconds(set.duration)}
                              {set.distance ? ` • ${set.distance} m` : ''}
                          </span>
                        ) : exerciseType === 'flexibility' ? (
                          <span>
                            {set.holdTime || 0}s hold
                            {set.reps ? ` × ${set.reps}` : ''}
                          </span>
                        ) : exerciseType === 'speed_agility' ? (
                          <span>
                            {set.reps || 0} reps
                            {set.distance ? ` • ${set.distance}m` : ''}
                            {set.height ? ` • ${set.height}cm` : ''}
                          </span>
                        ) : (
                          <span>{formatDurationSeconds(set.duration)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Expand/Collapse indicator */}
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Expanded Form View */}
                {isExpanded && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPreviousSet(index);
                          }}
                          className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors touch-manipulation"
                        >
                          Copy Previous
                        </button>
                      )}
                      {sets.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSet(index);
                          }}
                          className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors touch-manipulation"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {renderFieldsForSet(index)}
                    </div>
                  </div>
                )}
              </div>
            </SwipeableSetRow>
          );
        })}

        {/* Add Set Button */}
        <button
          onClick={addSet}
          className="w-full py-3 sm:py-4 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-medium transition-colors border-2 border-dashed border-white/20 touch-manipulation"
        >
          + Add {getSetLabel()}
        </button>
        
        {/* Swipe hint - only show on mobile when there are multiple sets */}
        {sets.length > 1 && (
          <p className="text-xs text-gray-500 text-center mt-2 sm:hidden">
            💡 Swipe left on a set to delete, or tap to expand/collapse
          </p>
        )}
      </div>

      {/* RPE Helper Modal */}
      {showRPEHelper && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60">
          <div className="bg-bg-secondary rounded-lg p-6 max-w-md w-full mx-4 border border-border">
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
              className="mt-4 w-full py-2 bg-accent-primary hover:bg-accent-hover text-white rounded transition-colors"
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
            className="flex-1 py-3 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-hover active:bg-accent-active transition-colors touch-manipulation text-base"
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
