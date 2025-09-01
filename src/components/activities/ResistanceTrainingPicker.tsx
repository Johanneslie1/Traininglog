import React, { useState, useEffect } from 'react';
import { ActivityType } from '@/types/activityTypes';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import ExerciseSearch from '@/features/exercises/ExerciseSearch';
import CategoryButton, { Category } from '@/features/exercises/CategoryButton';
import { ExerciseHistoryPicker } from '@/features/programs/ExerciseHistoryPicker';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';

interface ResistanceTrainingPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null;
}

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-green-600', textColor: 'text-white' },
  { id: 'back', name: 'Back', icon: '🔙', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'legs', name: 'Legs', icon: '🦵', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-cyan-600', textColor: 'text-white' },
  { id: 'arms', name: 'Arms', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'core', name: 'Core', icon: '⭕', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-primary-600', textColor: 'text-white' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-orange-600', textColor: 'text-white' },
];

type ViewState = 'main' | 'search' | 'logging' | 'recentExercises';

const ResistanceTrainingPicker: React.FC<ResistanceTrainingPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  const [view, setView] = useState<ViewState>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  // If we're editing an exercise, go directly to logging view
  useEffect(() => {
    if (editingExercise) {
      // Convert UnifiedExerciseData to Exercise format
      const exerciseForLogger: Exercise = {
        id: editingExercise.id || `edit-${Date.now()}`,
        name: editingExercise.exerciseName,
        description: editingExercise.exerciseName,
        activityType: ActivityType.RESISTANCE,
        type: 'strength',
        category: 'general',
        equipment: [],
        instructions: [],
        difficulty: 'intermediate',
        primaryMuscles: [],
        secondaryMuscles: [],
        targetAreas: [],
        metrics: {
          trackWeight: true,
          trackReps: true,
          trackRPE: true
        },
        defaultUnit: 'kg'
      };
      setSelectedExercise(exerciseForLogger);
      setView('logging');
    }
  }, [editingExercise]);

  const handleProgramSelected = async (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    if (!user?.id) return;

    try {
      for (const { exercise, sets } of exercises) {
        await addExerciseLog(
          {
            exerciseName: exercise.name,
            userId: user.id,
            sets: sets,
            activityType: ActivityType.RESISTANCE
          },
          selectedDate || new Date()
        );
      }

      onActivityLogged();
    } catch (error) {
      console.error('Error saving program exercises:', error);
    }
  };

  if (view === 'recentExercises') {
    return (
      <ExerciseHistoryPicker
        onClose={() => setView('main')}
        onSelectExercises={handleProgramSelected}
      />
    );
  }

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('main')}
        category={selectedCategory}
        onSelectExercise={(exercise) => {
          // Properly convert exercise without overriding important properties
          const resistanceExercise: Exercise = {
            ...exercise,
            activityType: ActivityType.RESISTANCE,
            type: exercise.type || 'strength',
            metrics: {
              trackWeight: true,
              trackReps: true,
              trackRPE: true,
              ...exercise.metrics
            },
            defaultUnit: exercise.defaultUnit || 'kg'
          };
          setSelectedExercise(resistanceExercise);
          setView('logging');
        }}
      />
    );
  }

  if (view === 'logging' && selectedExercise) {
    return (
      <UniversalSetLogger
        exercise={selectedExercise}
        onCancel={() => setView('main')}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            console.log('💾 ResistanceTrainingPicker: Starting to save exercise sets:', {
              exercise: selectedExercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            const exerciseLogData = {
              exerciseName: selectedExercise.name,
              userId: user.id,
              sets: sets,
              activityType: ActivityType.RESISTANCE
            };

            console.log('💾 ResistanceTrainingPicker: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date(),
              editingExercise?.id // Pass existing ID for updates
            );

            console.log('✅ ResistanceTrainingPicker: Exercise saved successfully with ID:', docId);

            onActivityLogged();
            setView('main');
          } catch (error) {
            console.error('❌ ResistanceTrainingPicker: Error saving exercise:', error);
          }
        }}
        initialSets={editingExercise?.sets || []}
        isEditing={!!editingExercise}
      />
    );
  }

  // Main view - shows search, recent exercises, and muscle groups
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
      {/* Header */}
      <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-white">🏋️‍♂️ Resistance Training</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
        <div className="max-w-md mx-auto p-4 space-y-6 md:space-y-8">
          {/* Search Box */}
          <section className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search exercises..."
                className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onFocus={() => {
                  setSelectedCategory(null);
                  setView('search');
                }}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </section>

          {/* Quick Options */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Quick Options</h3>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <CategoryButton
                category={{ id: 'recent', name: 'Recent Exercises', icon: '🕒', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' }}
                onClick={() => setView('recentExercises')}
              />
            </div>
          </section>

          {/* Muscle Groups */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Muscle Groups</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
              {muscleGroups.map(category => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setView('search');
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ResistanceTrainingPicker;
