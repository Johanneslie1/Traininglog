import { useState } from 'react';
import ExerciseSearch from './ExerciseSearch';
import Calendar from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { db } from '@/services/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { Exercise, ExerciseSet } from '@/types/exercise';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';
import CategoryButton, { Category } from './CategoryButton';
import ProgramExercisePicker from '@/features/programs/ProgramExercisePicker';

type ExerciseType = Exercise['type'];
type ExerciseWithSets = Exercise & { sets?: ExerciseSet[] };

type ExerciseData = Partial<ExerciseWithSets>;
type ExerciseWithId = Required<Pick<ExerciseWithSets, 'id' | 'name' | 'type' | 'category'>> & Partial<ExerciseWithSets>;

interface ExerciseLog {
  exerciseName: string;
  timestamp: Date;
  userId: string;
  sets: ExerciseSet[];
  deviceId?: string;
}

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
  selectedDate?: Date;
}

type ViewState = 'main' | 'search' | 'calendar' | 'setLogger' | 'programPicker' | 'copyPrevious';

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
  const authState = useSelector((state: RootState) => state.auth);
  const [view, setView] = useState<ViewState>('main');
  const [currentExercise, setCurrentExercise] = useState<ExerciseWithId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const handleExerciseLog = async (exercise: ExerciseWithId, date: Date, sets: ExerciseSet[] = []) => {
    if (!authState?.user) return;

    try {
      const exerciseLog: ExerciseLog = {
        exerciseName: exercise.name,
        userId: String(authState.user.id), // Convert whatever ID format to string
        timestamp: date,
        sets: sets,
        deviceId: 'web'
      };

      await addDoc(collection(db, 'exerciseLogs'), exerciseLog);
      onExerciseAdded?.();
      onClose();
    } catch (error) {
      console.error('Error logging exercise:', error);
    }
  };
  
  const addExerciseToSession = async (exercise: ExerciseData) => {
    try {
      const exerciseWithId: ExerciseWithId = {
        id: String(Date.now()),
        name: exercise.name || 'Unnamed Exercise',
        type: exercise.type || 'strength',
        category: exercise.category || 'compound', // Using 'compound' as default category for strength exercises
        description: exercise.description || '',
        primaryMuscles: exercise.primaryMuscles || [],
        secondaryMuscles: exercise.secondaryMuscles || [],
        instructions: exercise.instructions || [],
        defaultUnit: exercise.defaultUnit || 'kg',
        metrics: exercise.metrics || {
          trackWeight: true,
          trackReps: true
        },
        sets: exercise.sets || []
      };
      await handleExerciseLog(exerciseWithId, selectedDate || new Date());
    } catch (error) {
      console.error('Error adding exercise to session:', error);
    }
  };

  const handleCopyExercises = (exercises: ExerciseData[]) => {
    exercises.forEach(exercise => {
      const validExercise: ExerciseData = {
        name: String(exercise.name || ''),
        type: 'strength' as Exercise['type'],
        category: 'compound' as Exercise['category'],
        sets: exercise.sets || [],
        metrics: {
          trackWeight: true,
          trackReps: true
        },
        defaultUnit: 'kg'
      };
      addExerciseToSession(validExercise).catch(console.error);
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gymkeeper-dark rounded-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Add Exercise</h2>
            <button onClick={onClose} className="text-white hover:text-gray-300">
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
          
          {view === 'main' && (
            <div>
              {/* Helper Categories */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4">Other Options</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {helperCategories.map(category => (
                    <CategoryButton 
                      key={category.id}
                      category={category}
                      onClick={() => {
                        if (category.id === 'programs') {
                          setView('programPicker');
                        } else if (category.id === 'copyPrevious') {
                          setView('copyPrevious');
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Muscle Groups */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4">Muscle Groups</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              </div>

              {/* Training Types */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4">Training Types</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              </div>
            </div>
          )}

          {view === 'search' && selectedCategory && (
            <ExerciseSearch
              category={selectedCategory}
              onSelectExercise={(exercise) => {
                const exerciseWithId: ExerciseWithId = {
                  id: String(Date.now()),
                  name: exercise.name || 'Unnamed Exercise',
                  type: 'strength',
                  category: selectedCategory.id as any,
                  description: exercise.description || '',
                  primaryMuscles: [],
                  secondaryMuscles: [],
                  equipment: exercise.equipment,
                  instructions: [],
                  defaultUnit: 'kg',
                  metrics: {
                    trackWeight: true,
                    trackReps: true
                  },
                  sets: []
                };
                setCurrentExercise(exerciseWithId);
                setView('setLogger');
              }}
              onClose={onClose}
            />
          )}

          {view === 'calendar' && (
            <Calendar
              selectedDate={selectedDate || new Date()}
              onDateSelect={(date: Date) => {
                if (currentExercise) {
                  handleExerciseLog(currentExercise, date);
                }
              }}
              onSelectExercises={() => {}} // Not used in this context
              onClose={onClose}
            />
          )}

          {view === 'programPicker' && (
            <ProgramExercisePicker
              onClose={() => {
                setView('main');
                onClose();
              }}
              onSelectExercises={(exercises) => {
                exercises.forEach(({ exercise, sets }) => {
                  addExerciseToSession({
                    ...exercise,
                    name: exercise.name,
                    type: exercise.type as ExerciseType,
                    category: exercise.category,
                    sets
                  });
                });
                onClose();
              }}
            />
          )}

          {view === 'setLogger' && currentExercise && (
            <ExerciseSetLogger
              exercise={{
                id: currentExercise.id,
                name: currentExercise.name,
                type: 'strength' as ExerciseType,
                sets: currentExercise.sets || [],
              }}
              onSave={async (sets: ExerciseSet[]) => {
                await handleExerciseLog(currentExercise, selectedDate || new Date(), sets);
              }}
              onCancel={() => setView('search')}
            />
          )}

          {view === 'copyPrevious' && (
            <CopyFromPreviousSessionDialog
              isOpen={true}
              onClose={() => setView('main')}
              currentDate={selectedDate || new Date()}
              onExercisesSelected={async (exercises: ExerciseData[]) => {
                const validExercises = exercises.map(exercise => ({
                  name: String(exercise.name || ''),
                  type: 'strength' as Exercise['type'],
                  category: 'compound' as Exercise['category'], // Default to compound for copied exercises
                  sets: exercise.sets || []
                }));
                await handleCopyExercises(validExercises);
              }}
              userId={authState.user?.id || ''}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogOptions;
