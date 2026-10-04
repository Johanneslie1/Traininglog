import React, { useState, useEffect, useId, useMemo } from 'react';
import { Category } from './CategoryButton';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { toast } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { getMergedExercisesByActivityType } from '@/services/exerciseDatabaseService';
import { EmptyState, LoadingState } from '@/components/ui';
import {
  ActiveMovementPatternChip,
  MovementPatternFilterChips,
  MovementPatternFilterToggle,
} from '@/components/exercises/MovementPatternFilterChips';
import type { MovementPattern } from '@/data/movementPatterns';
import { exerciseMatchesMovementPattern } from '@/utils/exerciseMovementPattern';

interface ExerciseSearchProps {
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  category?: Category | null;
  onOpenRecent?: () => void;
}

const muscleChips: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'fullBody', label: 'Full-Body' },
];

const normalizeMuscle = (muscle: string): MuscleGroup => {
  const muscleMap: Record<string, MuscleGroup> = {
    'chest': 'chest',
    'pectorals': 'chest',
    'back': 'back',
    'lats': 'lats',
    'traps': 'traps',
    'shoulders': 'shoulders',
    'deltoids': 'shoulders',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'forearms': 'forearms',
    'legs': 'quadriceps',
    'quadriceps': 'quadriceps',
    'hip flexors': 'hip_flexors',
    'hip_flexors': 'hip_flexors',
    'hamstrings': 'hamstrings',
    'calves': 'calves',
    'glutes': 'glutes',
    'core': 'core',
    'abs': 'core',
    'abdominals': 'core',
    'lower back': 'lower_back',
    'full body': 'full_body'
  };

  const normalized = muscleMap[muscle.toLowerCase()];
  return normalized || 'full_body';
};

const matchesCategory = (exercise: Exercise, categoryId: string): boolean => {
  if (!categoryId || categoryId === 'all') return true;

  const primaryMuscles = exercise.primaryMuscles || [];

  switch (categoryId) {
    case 'chest':
      return primaryMuscles.includes('chest');
    case 'back':
      return primaryMuscles.some(m => ['back', 'lats', 'traps'].includes(m));
    case 'legs':
      return primaryMuscles.some(m => ['quadriceps', 'hip_flexors', 'hamstrings', 'calves', 'glutes'].includes(m));
    case 'shoulders':
      return primaryMuscles.includes('shoulders');
    case 'arms':
      return primaryMuscles.some(m => ['biceps', 'triceps', 'forearms'].includes(m));
    case 'core':
      return primaryMuscles.includes('core');
    case 'fullBody':
      return exercise.category === 'compound' || primaryMuscles.length > 2;
    case 'cardio':
      return exercise.type === 'cardio';
    case 'stretching':
      return exercise.type === 'flexibility';
    default:
      return true;
  }
};

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({
  onClose,
  onSelectExercise,
  category,
  onOpenRecent,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(category?.id || 'all');
  const [movementPattern, setMovementPattern] = useState<MovementPattern | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [combinedExercises, setCombinedExercises] = useState<Exercise[]>([]);
  const filterPanelId = useId();

  useEffect(() => {
    setActiveCategoryId(category?.id || 'all');
  }, [category?.id]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        setIsLoading(true);
        const exercises = await getMergedExercisesByActivityType(ActivityType.RESISTANCE, user?.id);
        setCombinedExercises(
          exercises.map((exercise) => ({
            ...exercise,
            primaryMuscles: (exercise.primaryMuscles || []).map(normalizeMuscle),
            secondaryMuscles: exercise.secondaryMuscles || []
          }))
        );
      } catch (error) {
        console.error('Error loading exercises:', error);
        toast.error('Failed to load exercises');
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [user?.id]);

  const filteredExercises = useMemo(() => {
    return combinedExercises.filter(exercise => {
      const primaryMuscles = exercise.primaryMuscles || [];
      const matchesSearch = searchTerm === '' ||
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        primaryMuscles.some(m =>
          m.toLowerCase().includes(searchTerm.toLowerCase())
        );

      if (!matchesSearch) return false;
      if (!exerciseMatchesMovementPattern(exercise, movementPattern)) return false;
      return matchesCategory(exercise, activeCategoryId);
    });
  }, [combinedExercises, searchTerm, movementPattern, activeCategoryId]);

  const handleCreateExercise = () => {
    setShowCreateDialog(true);
  };

  const handleExerciseCreated = async (exerciseId: string) => {
    setIsLoading(true);
    try {
      let exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
      if (!exerciseDoc.exists()) {
        exerciseDoc = await getDoc(doc(db, 'globalExercises', exerciseId));
      }

      if (exerciseDoc.exists()) {
        const data = exerciseDoc.data();
        const newExercise: Exercise = {
          ...data,
          id: exerciseId,
          primaryMuscles: data.primaryMuscles.map(normalizeMuscle),
          type: data.type as Exercise['type'],
          category: data.category as Exercise['category'],
          defaultUnit: data.defaultUnit as Exercise['defaultUnit']
        } as Exercise;

        setCombinedExercises(prev => [...prev, newExercise]);
        onSelectExercise(newExercise);
        onClose();
      } else {
        toast.error('Could not find the created exercise');
      }
    } catch (error) {
      console.error('Error fetching created exercise:', error);
      toast.error('Failed to load the created exercise');
    } finally {
      setIsLoading(false);
      setShowCreateDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-primary flex flex-col">
      <div className="sticky top-0 z-10 border-b border-border bg-bg-primary">
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-bg-tertiary"
            aria-label="Close search"
          >
            <svg className="h-6 w-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-grow">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exercises..."
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-text-primary transition-colors focus:border-accent-primary focus:outline-none"
            />
          </div>
          <MovementPatternFilterToggle
            open={showFilters}
            onToggle={() => setShowFilters((open) => !open)}
            panelId={filterPanelId}
            activeCount={movementPattern ? 1 : 0}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-3 pb-3" aria-label="Muscle filters">
          {onOpenRecent && (
            <button
              type="button"
              onClick={onOpenRecent}
              className="shrink-0 rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent-primary hover:text-text-primary"
            >
              Recent
            </button>
          )}
          {muscleChips.map((chip) => {
            const active = activeCategoryId === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveCategoryId(chip.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-accent-primary bg-accent-primary text-text-on-accent'
                    : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-primary hover:text-text-primary'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div id={filterPanelId} hidden={!showFilters} className={showFilters ? 'px-3 pb-3' : undefined}>
          <MovementPatternFilterChips selected={movementPattern} onSelect={setMovementPattern} />
        </div>
        {!showFilters && movementPattern && (
          <div className="px-3 pb-3">
            <ActiveMovementPatternChip
              pattern={movementPattern}
              onClear={() => setMovementPattern('')}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        <div className="px-3 py-2">
          {isLoading ? (
            <LoadingState label="Loading exercises..." />
          ) : filteredExercises.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredExercises.map((exercise) => {
                const muscles = (exercise.primaryMuscles || []).join(', ') || 'No muscles specified';
                return (
                  <button
                    key={exercise.id}
                    onClick={() => onSelectExercise(exercise)}
                    className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-hover-overlay"
                  >
                    <span className="h-5 w-0.5 shrink-0 rounded-full bg-accent-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {exercise.name}
                      </span>
                      <span className="block truncate text-xs text-text-tertiary">
                        {muscles}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4">
              <EmptyState
                title="No exercises found"
                description="Can't find what you're looking for?"
                illustration="search"
              />
              <button
                onClick={handleCreateExercise}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent-primary px-6 py-3 font-medium text-text-primary transition-colors hover:bg-accent-hover"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Create New Exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateDialog && (
        <CreateUniversalExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleExerciseCreated}
          activityType={ActivityType.RESISTANCE}
          searchQuery={searchTerm}
        />
      )}
    </div>
  );
};

export default ExerciseSearch;
