import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Exercise } from '@/types/exercise';
import type { ExerciseSet } from '@/types/sets';
import { SetEditorDialog } from '@/components/SetEditorDialog';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { SwipeableSetRow } from '@/components/SwipeableSetRow';
import { InlineEditableValue } from '@/components/InlineEditableValue';
import { DifficultyCategory } from '@/types/difficulty';
import { ActivityType } from '@/types/activityTypes';
import { toast } from 'react-hot-toast';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import { ExerciseHistorySummary } from '@/components/ExerciseHistorySummary';
import PrescriptionGuideCard from '@/components/exercises/PrescriptionGuideCard';
import { Prescription } from '@/types/program';
import { ExercisePrescriptionAssistantData } from '@/types/exercise';
import { prescriptionToSets } from '@/utils/prescriptionUtils';

interface ExerciseSetLoggerProps {
  exercise: Partial<Exercise> & { 
    id: string; 
    name: string;
    sets?: ExerciseSet[];
    type?: string;
    activityType?: ActivityType;
    prescription?: Prescription; // Prescription data from program
    instructionMode?: 'structured' | 'freeform'; // Instruction mode from program
    instructions?: string | string[];
    prescriptionAssistant?: ExercisePrescriptionAssistantData;
  };
  onSave: ((sets: ExerciseSet[], exerciseId: string, metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void) | ((sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void);
  onCancel: () => void;
  isEditing?: boolean;
  previousSet?: ExerciseSet; // Optional previous set for copying
  showPreviousSets?: boolean; // Whether to show previous sets option
  useExerciseId?: boolean; // Whether to pass exerciseId to onSave
}

// Check if exercise is non-resistance type and should use universal logger
const shouldUseUniversalLogger = (exercise: Partial<Exercise>): boolean => {
  // Check activityType first
  if (exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE) {
    return true;
  }

  // Check type field
  if (exercise.type) {
    const nonResistanceTypes = ['cardio', 'endurance', 'flexibility', 'teamSports', 'speedAgility', 'speed_agility', 'other'];
    if (nonResistanceTypes.includes(exercise.type)) {
      return true;
    }
  }

  // Check category for hints
  const category = exercise.category?.toLowerCase() || '';
  if (category.includes('cardio') || 
      category.includes('endurance') || 
      category.includes('stretch') || 
      category.includes('sport') || 
      category.includes('agility') ||
      category.includes('plyometric')) {
    return true;
  }

  return false;
};

export const ExerciseSetLogger: React.FC<ExerciseSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  isEditing = false,
  previousSet: externalPreviousSet,
  showPreviousSets = true,
  useExerciseId = false
}) => {
  // Check if we should use the universal logger for non-resistance exercises
  if (shouldUseUniversalLogger(exercise)) {
    const handleUniversalSave = (sets: ExerciseSet[]) => {
      if (useExerciseId) {
        (onSave as (sets: ExerciseSet[], exerciseId: string, metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void)(sets, exercise.id, {
          prescriptionAssistant: exercise.prescriptionAssistant
        });
      } else {
        (onSave as (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void)(sets, {
          prescriptionAssistant: exercise.prescriptionAssistant
        });
      }
    };

    return (
      <UniversalSetLogger
        exercise={exercise as Exercise}
        onSave={handleUniversalSave}
        onCancel={onCancel}
        initialSets={exercise.sets || []}
        isEditing={isEditing}
        prescription={exercise.prescription}
        instructionMode={exercise.instructionMode}
        prescriptionAssistant={exercise.prescriptionAssistant}
      />
    );
  }

  // Use traditional resistance training logger for strength exercises
  const [followPrescription, setFollowPrescription] = useState<boolean>(true);
  const prescriptionApplied = false;
  
  const [sets, setSets] = useState<ExerciseSet[]>(() => {
    if (isEditing && exercise.sets && exercise.sets.length > 0) {
      return exercise.sets;
    }
    return [{ weight: 0, reps: 5, difficulty: DifficultyCategory.EASY }];
  });
  
  const [isAddingSet, setIsAddingSet] = useState(!isEditing);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const setsListRef = useRef<HTMLDivElement>(null);
  
  // Fetch exercise history for progressive overload context
  const exerciseHistory = useExerciseHistory(exercise.name);

  // Check if exercise has prescription from program
  const hasPrescription = exercise.prescription && exercise.instructionMode === 'structured';

  const prescriptionTargetSets = useMemo(() => {
    if (!hasPrescription || !exercise.prescription) {
      return [] as ExerciseSet[];
    }

    try {
      return prescriptionToSets(
        exercise.prescription,
        exercise.activityType || ActivityType.RESISTANCE
      );
    } catch {
      return [] as ExerciseSet[];
    }
  }, [hasPrescription, exercise.prescription, exercise.activityType]);

  // Check if exercise has instructions from program prescription
  const hasInstructions = exercise.instructions && exercise.instructions.length > 0;
  const instructionsText = hasInstructions 
    ? (Array.isArray(exercise.instructions) ? exercise.instructions[0] : exercise.instructions)
    : null;

  // Keep a single editable first set; do not auto-prefill multiple sets
  useEffect(() => {
    if (!isEditing && sets.length === 0) {
      setSets([{ weight: 0, reps: 5, difficulty: DifficultyCategory.EASY }]);
    }
  }, [isEditing, sets.length]);

  // Toggle prescription pre-filling
  const handleTogglePrescription = () => {
    const newValue = !followPrescription;
    setFollowPrescription(newValue);

    if (!newValue && prescriptionApplied) {
      toast('Prescription mode disabled. Modify sets as needed.', { 
        duration: 2000,
        icon: 'ℹ️' 
      });
    }
  };

  // Handle copying last values from exercise history
  const handleCopyLastHistoryValues = (historySets: ExerciseSet[]) => {
    if (historySets.length > 0) {
      setSets(historySets);
      toast.success(`Copied ${historySets.length} set${historySets.length > 1 ? 's' : ''} from last session`, {
        duration: 2000,
        icon: '📋',
      });
    }
  };

  // Get the appropriate previous set based on context
  const getPreviousSet = (currentIndex?: number): ExerciseSet | undefined => {
    // If we're editing and have a valid index, use the previous set in sequence
    if (typeof currentIndex === 'number' && currentIndex > 0) {
      return sets[currentIndex - 1];
    }
    
    // If we're adding a new set, use the last set
    if (showPreviousSets) {
      // First try the last set in the current exercise
      if (sets.length > 0) {
        return sets[sets.length - 1];
      }
      // If no sets in current exercise, use the externally provided previous set
      return externalPreviousSet;
    }
    
    return undefined;
  };

  // Debug logging for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ExerciseSetLogger state:', {
        sets,
        isEditing,
        editingSetIndex,
        externalPreviousSet,
        showPreviousSets
      });
    }
  }, [sets, isEditing, editingSetIndex, externalPreviousSet, showPreviousSets]);

  const handleSetSave = (editedSet: ExerciseSet, index?: number) => {
    if (typeof index === 'number') {
      setSets(sets.map((s, i) => i === index ? editedSet : s));
      setEditingSetIndex(null);
      toast.success(`Set ${index + 1} updated`, {
        duration: 1500,
        style: {
          background: '#2a2a2a',
          color: '#fff',
        },
      });
    } else {
      const newIndex = sets.length;
      setSets([...sets, editedSet]);
      setLastAddedIndex(newIndex);
      
      toast.success(`Set ${newIndex + 1} added`, {
        duration: 1500,
        icon: '✓',
        style: {
          background: '#2a2a2a',
          color: '#fff',
          border: '1px solid rgba(139, 92, 246, 0.5)',
        },
      });
      
      // Scroll to the new set
      setTimeout(() => {
        if (setsListRef.current) {
          setsListRef.current.scrollTo({
            top: setsListRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 100);
      
      // Clear animation state after animation completes
      setTimeout(() => {
        setLastAddedIndex(null);
      }, 600);
    }
    setIsAddingSet(false);
  };

  const handleSetDelete = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
      
      // Adjust editing index if needed
      if (editingSetIndex !== null) {
        if (editingSetIndex === index) {
          setEditingSetIndex(null);
        } else if (editingSetIndex > index) {
          setEditingSetIndex(editingSetIndex - 1);
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
  };
  
  // Inline update for quick edits without opening the full dialog
  const handleInlineUpdate = (index: number, field: keyof ExerciseSet, value: number | string) => {
    setSets(sets.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSaveAndClose = () => {
    if (sets.length === 0) {
      onCancel();
      return;
    }
    
    if (useExerciseId) {
      (onSave as (sets: ExerciseSet[], exerciseId: string, metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void)(sets, exercise.id, {
        prescriptionAssistant: exercise.prescriptionAssistant
      });
    } else {
      (onSave as (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => void)(sets, {
        prescriptionAssistant: exercise.prescriptionAssistant
      });
    }
  };

  const getResistanceTargetText = (index: number) => {
    if (prescriptionTargetSets.length === 0) {
      return null;
    }

    const safeIndex = Math.min(index, prescriptionTargetSets.length - 1);
    const targetSet = prescriptionTargetSets[safeIndex];
    if (!targetSet) {
      return null;
    }

    const targetWeight = targetSet.weight ?? 0;
    const targetReps = targetSet.reps ?? 0;
    return `Target: ${targetWeight}kg × ${targetReps}`;
  };

  const renderSetSummary = (set: ExerciseSet, index: number) => {
    const isNewlyAdded = lastAddedIndex === index;
    
    return (
      <SwipeableSetRow
        key={index}
        onDelete={() => handleSetDelete(index)}
        disabled={sets.length <= 1}
      >
        <div 
          className={`
            flex items-center justify-between p-4 bg-bg-tertiary rounded-lg 
            cursor-pointer hover:bg-bg-tertiary transition-colors
            ${isNewlyAdded ? 'set-added-animation' : ''}
          `}
        >
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <span className="text-text-tertiary shrink-0">Set {index + 1}</span>
            {followPrescription && hasPrescription && (
              <span className="text-[11px] text-primary-300 bg-primary-900/20 border border-primary-700/40 rounded px-2 py-0.5">
                {getResistanceTargetText(index) || 'Target available'}
              </span>
            )}
            
            {/* Inline editable weight and reps */}
            <div className="flex items-center gap-1">
              <InlineEditableValue
                value={set.weight}
                onSave={(val) => handleInlineUpdate(index, 'weight', val)}
                type="number"
                min={0}
                step={0.5}
                unit="kg"
                displayClassName="text-text-primary font-medium"
                formatDisplay={(v) => `${v ?? 0}kg`}
              />
              <span className="text-gray-500">×</span>
              <InlineEditableValue
                value={set.reps}
                onSave={(val) => handleInlineUpdate(index, 'reps', val)}
                type="number"
                min={0}
                step={1}
                displayClassName="text-text-primary font-medium"
                formatDisplay={(v) => `${v ?? 0}`}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
              set.difficulty === DifficultyCategory.WARMUP ? 'bg-gray-600' :
              set.difficulty === DifficultyCategory.EASY ? 'bg-green-600' :
              set.difficulty === DifficultyCategory.NORMAL ? 'bg-blue-600' :
              set.difficulty === DifficultyCategory.HARD ? 'bg-red-600' :
              set.difficulty === DifficultyCategory.DROP ? 'bg-purple-600' :
              'bg-gray-600'
            }`}>
              {set.difficulty}
            </span>
            
            {/* Edit button to open full dialog */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingSetIndex(index);
              }}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Edit set details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </SwipeableSetRow>
    );
  };



  return (
    <div className="flex flex-col h-full bg-bg-secondary">
      <div ref={setsListRef} className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">
            {isEditing ? 'Edit' : 'Log'} {exercise.name}
          </h2>
          <span className="text-text-tertiary">{sets.length} sets</span>
        </div>

        <div className="sticky top-0 z-20 pb-2 bg-bg-secondary/95 backdrop-blur-sm">
          <PrescriptionGuideCard
            activityType={exercise.activityType || ActivityType.RESISTANCE}
            prescription={exercise.prescription}
            instructionMode={exercise.instructionMode}
            instructionsText={instructionsText}
            isEditing={isEditing}
            followPrescription={followPrescription}
            prescriptionApplied={prescriptionApplied}
            onToggleFollow={!isEditing && hasPrescription ? handleTogglePrescription : undefined}
            uiHint={exercise.prescriptionAssistant?.uiHint}
            warnings={exercise.prescriptionAssistant?.warnings}
            alternatives={exercise.prescriptionAssistant?.alternatives}
            progressionNote={exercise.prescriptionAssistant?.progressionNote}
          />
        </div>
        
        {/* Exercise History Summary - helps with progressive overload */}
        {!isEditing && (
          <ExerciseHistorySummary
            exerciseName={exercise.name}
            historyData={exerciseHistory}
            onCopyLastValues={handleCopyLastHistoryValues}
            compact={false}
          />
        )}

        <div className="space-y-2">
          {sets.map((set, index) => renderSetSummary(set, index))}
        </div>
        
        {/* Swipe hint - only show on mobile when there are multiple sets */}
        {sets.length > 1 && (
          <p className="text-xs text-gray-500 text-center mt-3 sm:hidden">
            💡 Swipe left on a set to delete, or tap values to edit inline
          </p>
        )}

        {/* Set Editor Dialog */}
        {(isAddingSet || editingSetIndex !== null) && (
          <SetEditorDialog
            onSave={(editedSet) => handleSetSave(editedSet, editingSetIndex ?? undefined)}
            onClose={() => {
              setIsAddingSet(false);
              setEditingSetIndex(null);
            }}
            initialSet={editingSetIndex !== null ? sets[editingSetIndex] : undefined}
            previousSet={getPreviousSet(editingSetIndex ?? undefined)}
            exerciseName={exercise.name}
            setNumber={(editingSetIndex !== null ? editingSetIndex : sets.length) + 1}
            totalSets={editingSetIndex !== null ? sets.length : sets.length + 1}
            onDelete={editingSetIndex !== null ? () => handleSetDelete(editingSetIndex) : undefined}
          />
        )}

        {/* Add Set Button */}
        {!isAddingSet && editingSetIndex === null && (
          <button
            onClick={() => setIsAddingSet(true)}
            className="w-full py-4 mt-4 rounded-lg bg-white/5 hover:bg-white/10 text-text-primary font-medium transition-colors"
          >
            Add Set
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-4">
          <button
            onClick={handleSaveAndClose}
            className="flex-1 py-3 rounded-lg bg-accent-primary text-text-primary font-medium hover:bg-accent-secondary transition-colors"
          >
            {isEditing ? 'Update' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-white/5 text-text-primary font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
