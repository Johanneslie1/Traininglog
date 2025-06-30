import { useState, useCallback } from 'react';
import ExerciseSearch from './ExerciseSearch';
import Calendar from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { db } from '@/services/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ExerciseSet, Exercise } from '@/types/exercise';
import { ExerciseData } from '@/services/exerciseDataService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';

type ExerciseTemplate = Omit<Exercise, 'id'>;
type ExerciseWithId = Exercise & { sets?: ExerciseSet[] };

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
  selectedDate?: Date;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
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

const trainingTypes: Category[] = [
  { id: 'cardio', name: 'Cardio', icon: '🏃', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'agility', name: 'Agility', icon: '⚡', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'speed', name: 'Speed', icon: '🏃‍♂️', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'stretching', name: 'Stretching', icon: '🧘‍♂️', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-green-600', textColor: 'text-white' },
];

export const LogOptions = ({ onClose, onExerciseAdded, selectedDate }: LogOptionsProps): JSX.Element => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [view, setView] = useState<'main' | 'search' | 'calendar' | 'setLogger'>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [recentExercises, setRecentExercises] = useState<ExerciseData[]>([]);
  const [currentExercise, setCurrentExercise] = useState<ExerciseWithId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const handleCopyExercises = async (exercises: ExerciseData[]) => {
    try {
      setError(null);
      // Save all selected exercises
      for (const exercise of exercises) {
        await addDoc(collection(db, 'exerciseLogs'), {
          ...exercise,
          timestamp: selectedDate || new Date()
        });
      }
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      setShowCopyDialog(false); // Only close the copy dialog, not the main log options
    } catch (error) {
      console.error('Error copying exercises:', error);
      setError('Failed to copy exercises. Please try again.');
    }
  };

  const handleCategorySelect = useCallback((category: Category) => {
    setSelectedCategory(category);
    setView('search');
  }, []);

  const handleSelectExercisesFromDay = useCallback((exercises: ExerciseData[]) => {
    setRecentExercises(exercises);
    setView('main');
  }, []);

  // Utility function to check if an exercise already exists for the day
  const checkExerciseExists = useCallback(async (exerciseName: string, timestamp: Date, userId: string) => {
    const startOfDay = new Date(timestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(timestamp);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'exerciseLogs'),
      where('userId', '==', userId),
      where('exerciseName', '==', exerciseName),
      where('timestamp', '>=', startOfDay),
      where('timestamp', '<=', endOfDay)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }, []);

  // Add exercise to today's workout
  const addExerciseToToday = useCallback(async (exercise: ExerciseData) => {
    try {
      if (!user?.id) {
        throw new Error('You must be logged in to save exercises');
      }

      const timestamp = selectedDate || new Date();
      
      // Check for duplicates
      const exists = await checkExerciseExists(exercise.exerciseName, timestamp, user.id);
      if (exists) {
        const proceed = window.confirm('This exercise already exists for today. Add it anyway?');
        if (!proceed) return;
      }

      const newExercise = {
        ...exercise,
        timestamp,
        userId: user.id
      };

      // Save to Firestore
      const { id, ...dataForFirestore } = newExercise;
      await addDoc(collection(db, 'exerciseLogs'), dataForFirestore);
      
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving exercise:', error);
      setError('Failed to add exercise. Please try again.');
    }
  }, [user, selectedDate, checkExerciseExists, onExerciseAdded, onClose]);

  const handleSaveSets = useCallback(async (sets: ExerciseSet[]) => {
    if (!currentExercise || !user?.id) return;
    
    try {
      setError(null);
      
      const exerciseLog: ExerciseData = {
        exerciseName: currentExercise.name,
        sets,
        timestamp: selectedDate || new Date(),
        userId: user.id
      };
      
      await addDoc(collection(db, 'exerciseLogs'), exerciseLog);
      
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving exercise with sets:', error);
      setError('Failed to save exercise. Please try again.');
    }
  }, [currentExercise, user, selectedDate, onExerciseAdded, onClose]);

  if (view === 'search') {
    return (
      <ExerciseSearch 
        onClose={() => setView('main')}
        onSelectExercise={(exercise: ExerciseTemplate) => {
          // Generate a temporary ID for the exercise
          const exerciseWithId: ExerciseWithId = {
            ...exercise,
            id: `temp-${Date.now()}`,
            sets: []
          };
          setCurrentExercise(exerciseWithId);
          setView('setLogger');
        }}
        category={selectedCategory}
      />
    );
  }

  if (view === 'calendar') {
    return (
      <Calendar 
        selectedDate={selectedDate || new Date()}
        onClose={() => setView('main')}
        onSelectExercises={handleSelectExercisesFromDay}
        onDateSelect={(_date: Date) => {
          if (onExerciseAdded) {
            onExerciseAdded();
          }
          onClose();
        }}
      />
    );
  }

  if (view === 'setLogger' && currentExercise) {
    return (
      <ExerciseSetLogger
        exercise={currentExercise}
        onSave={handleSaveSets}
        onCancel={() => setView('main')}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Header */}
      <header className="flex-none flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <h1 className="text-xl font-medium text-white">Add Exercise</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-safe">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setView('calendar')}
              className="bg-[#1f2e24] p-4 rounded-xl hover:bg-[#2f3e34] transition-colors flex flex-col items-center"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-green-400 font-medium">From another day</div>
            </button>

            <button 
              onClick={() => setShowCopyDialog(true)}
              className="bg-[#1f1f2e] p-4 rounded-xl hover:bg-[#2f2f3e] transition-colors flex flex-col items-center"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-purple-400 font-medium">Copy Previous Session</div>
            </button>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-lg font-medium text-white mb-3">Muscle Groups</h2>
            <div className="grid grid-cols-2 gap-3">
              {muscleGroups.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="flex items-center p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
                >
                  <div className={`w-10 h-10 ${category.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <span className="text-white">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-white mb-3">Training Types</h2>
            <div className="grid grid-cols-2 gap-3">
              {trainingTypes.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="flex items-center p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
                >
                  <div className={`w-10 h-10 ${category.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <span className="text-white">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Exercises */}
          {recentExercises.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Recent Exercises</h2>
              <div className="space-y-2">
                {recentExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToToday(exercise)}
                    className="w-full p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
                  >
                    <div className="text-white">{exercise.exerciseName}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(exercise.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Copy from Previous Session Dialog */}
      <CopyFromPreviousSessionDialog
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        currentDate={selectedDate || new Date()}
        onExercisesSelected={handleCopyExercises}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default LogOptions;
