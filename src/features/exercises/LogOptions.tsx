import { useState } from 'react';
import ExerciseSearch from './ExerciseSearch';
import { db } from '@/services/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';
import CategoryButton, { Category } from './CategoryButton';
import ProgramExercisePicker from '@/features/programs/ProgramExercisePicker';
import { SetEditorDialog } from '@/components/SetEditorDialog';

type ExerciseData = Partial<Exercise & { sets?: ExerciseSet[] }>;

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
  selectedDate?: Date;
}

type ViewState = 'main' | 'search' | 'calendar' | 'setEditor' | 'programPicker' | 'copyPrevious';

const helperCategories: Category[] = [
  { id: 'programs', name: 'Add from Program', icon: '📋', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-purple-600', textColor: 'text-white' },
  { id: 'copyPrevious', name: 'Copy from Previous', icon: '📝', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
];

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-green-600', textColor: 'text-white' },
  { id: 'back', name: 'Back', icon: '🔙', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'legs', name: 'Legs', icon: '🦵', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-cyan-600', textColor: 'text-white' },
  { id: 'arms', name: 'Arms', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'core', name: 'Core', icon: '⭕', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-primary-600', textColor: 'text-white' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-orange-600', textColor: 'text-white' },
];

const trainingTypes: Category[] = [
  { id: 'cardio', name: 'Cardio', icon: '🏃', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'agility', name: 'Agility', icon: '⚡', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'speed', name: 'Speed', icon: '🏃‍♂️', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'stretching', name: 'Stretching', icon: '🧘‍♂️', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-green-600', textColor: 'text-white' },
];

export const LogOptions = ({ onClose, onExerciseAdded, selectedDate }: LogOptionsProps): JSX.Element => {
  const [view, setView] = useState<ViewState>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleProgramSelected = async (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    if (!user?.id) return;
    
    try {
      // Save each exercise with its sets
      for (const { exercise, sets } of exercises) {
        await addDoc(collection(db, 'exerciseLogs'), {
          exerciseName: exercise.name,
          timestamp: selectedDate || new Date(),
          userId: user.id,
          sets: sets,
          exerciseId: exercise.id,
          type: exercise.type || 'strength',
          deviceId: window.navigator.userAgent
        });
      }
      
      setView('main');
      onExerciseAdded?.();
    } catch (error) {
      console.error('Error saving program exercises:', error);
      // Here you might want to show an error notification to the user
    }
  };

  const handleCopiedExercises = async (exercises: ExerciseData[]) => {
    if (!user?.id) return;
    
    try {
      // Save each copied exercise
      for (const exercise of exercises) {
        if (!exercise.name) continue;
        
        await addDoc(collection(db, 'exerciseLogs'), {
          exerciseName: exercise.name,
          timestamp: selectedDate || new Date(),
          userId: user.id,
          sets: exercise.sets || [],
          exerciseId: exercise.id || `copied-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
          type: exercise.type || 'strength',
          deviceId: window.navigator.userAgent
        });
      }
      
      setView('main');
      onExerciseAdded?.();
    } catch (error) {
      console.error('Error saving copied exercises:', error);
      // Here you might want to show an error notification to the user
    }
  };

  // Conditional rendering for different views
  if (view === 'programPicker') {
    return (
      <ProgramExercisePicker
        onClose={() => setView('main')}
        onSelectExercises={handleProgramSelected}
      />
    );
  }

  if (view === 'copyPrevious') {
    return (
      <CopyFromPreviousSessionDialog
        isOpen={true}
        onClose={() => setView('main')}
        onExercisesSelected={handleCopiedExercises}
        currentDate={selectedDate || new Date()}
        userId={user?.id || ''}
      />
    );
  }

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('main')}
        category={selectedCategory}
        onSelectExercise={(exercise) => {
          // Convert the exercise template to a full Exercise
          setSelectedExercise({
            ...exercise,
            id: `temp-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
            description: exercise.description || '',
            primaryMuscles: [],
            secondaryMuscles: [],
            instructions: [],
            metrics: {
              trackWeight: true,
              trackReps: true
            },
            defaultUnit: 'kg'
          });
          setView('setEditor');
        }}
      />
    );
  }

  if (view === 'setEditor' && selectedExercise) {
    return (
      <SetEditorDialog
        onClose={() => {
          setSelectedExercise(null);
          setView('main');
        }}
        onSave={async (set) => {
          try {
            if (!user?.id) throw new Error('User not authenticated');
            
            // Create exercise log entry
            await addDoc(collection(db, 'exerciseLogs'), {
              exerciseName: selectedExercise.name,
              timestamp: selectedDate || new Date(),
              userId: user.id,
              sets: [set],
              exerciseId: selectedExercise.id,
              type: selectedExercise.type || 'strength',
              deviceId: window.navigator.userAgent
            });

            onExerciseAdded?.();
            setSelectedExercise(null);
            setView('main');
          } catch (error) {
            console.error('Error saving exercise:', error);
            // Here you might want to show an error notification to the user
          }
        }}
        exerciseName={selectedExercise.name}
        setNumber={1}
        totalSets={1}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
      {/* Header - Fixed at top */}
      <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Add Exercise</h2>
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

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
        <div className="max-w-md mx-auto p-4 space-y-6 md:space-y-8">
          {/* Quick Add Section */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Quick Add</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {helperCategories.map(category => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => setView(category.id === 'programs' ? 'programPicker' : 'copyPrevious')}
                />
              ))}
            </div>
          </section>

          {/* Muscle Groups Section */}
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

          {/* Training Types Section */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Training Types</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
              {trainingTypes.map(category => (
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

export default LogOptions;
