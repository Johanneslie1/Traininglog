import React, { useState } from 'react';
import ExerciseSearch from './ExerciseSearch';
import Calendar from './Calendar';
import ProgramManager from './ProgramManager';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { db, auth } from '@/services/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getDeviceId, saveExerciseLog } from '@/utils/localStorageUtils';
import { Program, ExerciseSet, DifficultyCategory } from '@/types/exercise';
import { ExerciseData } from '@/services/exerciseDataService';
import { v4 as uuidv4 } from 'uuid';

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

export const LogOptions: React.FC<LogOptionsProps> = ({ onClose, onExerciseAdded, selectedDate }) => {
  const [view, setView] = useState<'main' | 'search' | 'calendar' | 'setLogger' | 'program'>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [recentExercises, setRecentExercises] = useState<ExerciseData[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  // Using local state for UI management only

  const handleCategorySelect= (category: Category) => {
    setSelectedCategory(category);
    setView('search');
  };
  const handleSelectExercisesFromDay = (exercises: ExerciseData[]) => {
    setRecentExercises(exercises);
    setView('main');
  };
  
  // Utility function to check if an exercise already exists for the day
  const checkExerciseExists = async (exerciseName: string, timestamp: Date, userId: string) => {
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
  };

  // Utility function to save exercise with proper error handling
  const saveExerciseWithRetry = async (exerciseData: ExerciseData) => {
    const maxRetries = 3;
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // First save to Firestore
        const { id, ...dataForFirestore } = exerciseData;
        const docRef = await addDoc(collection(db, 'exerciseLogs'), dataForFirestore);
        
        // If Firestore save successful, save to localStorage with Firestore ID
        const exerciseWithId = {
          ...exerciseData,
          id: docRef.id
        };
        saveExerciseLog(exerciseWithId);
        return true;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }

    // If all retries failed, save to localStorage with a temporary ID
    console.error('Failed to save to Firebase after retries:', lastError);
    const tempId = `local-${uuidv4()}`;
    saveExerciseLog({ ...exerciseData, id: tempId });
    return false;
  };

  const addExerciseToToday = async (exercise: ExerciseData) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to save exercises');
      }

      const deviceId = getDeviceId();
      const timestamp = selectedDate || new Date();
      
      // Check for duplicates
      const exists = await checkExerciseExists(exercise.exerciseName, timestamp, auth.currentUser.uid);
      if (exists) {
        const proceed = window.confirm('This exercise already exists for today. Add it anyway?');
        if (!proceed) return;
      }

      const newExercise = {
        ...exercise,
        timestamp,
        deviceId,
        userId: auth.currentUser.uid
      };

      await saveExerciseWithRetry(newExercise);

      // Notify parent that an exercise was added
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Failed to add exercise. Please try again.');
    }
  };

  const handleSaveSets = async (sets: ExerciseSet[]) => {
    if (!currentExercise) return;
    
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to save exercises');
      }

      const deviceId = getDeviceId();
      const timestamp = selectedDate || new Date();
      
      const exerciseLog = {
        id: uuidv4(),
        exerciseName: currentExercise.name,
        sets,
        timestamp,
        deviceId,
        userId: auth.currentUser.uid
      };

      await saveExerciseWithRetry(exerciseLog);
      
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving exercise with sets:', error);
      alert('Failed to save exercise. Please try again.');
    }
  };
  const handleProgramSelected = (program: Program) => {
    // When a program is selected, we want to add each exercise with empty sets
    try {      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to save exercises');
      }

      const deviceId = getDeviceId();
      const timestamp = selectedDate || new Date();
      
      // For each exercise in the program, create an exercise log
      program.exercises.forEach(async (programExercise) => {
        // Create empty sets based on the number specified in the program
        const sets = Array(programExercise.sets).fill(null).map(() => ({
          reps: 0,
          weight: 0,
          difficulty: 'moderate' as DifficultyCategory
        }));
        
        const exerciseLog = {
          exerciseName: programExercise.name,
          sets,
          timestamp,
          deviceId,
          userId: currentUser.uid
        };
        
        // Save to local storage
        saveExerciseLog(exerciseLog);
        
        // Save to Firebase
        try {
          console.log('Adding program exercise to Firebase:', exerciseLog);
          await addDoc(collection(db, 'exerciseLogs'), exerciseLog);
          console.log('Successfully saved program exercise to Firebase');
        } catch (firebaseError) {
          console.error('Failed to save to Firebase:', firebaseError);
        }
      });
      
      // Notify parent that exercises were added
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose(); // Close modal after adding
    } catch (error) {
      console.error('Failed to add program exercises:', error);
      alert('Failed to add program exercises.');
    }
  };
  if (view === 'search') {
    return (
      <ExerciseSearch 
        onClose={() => setView('main')}
        onSelectExercise={(exercise) => {
          // Save the selected exercise for the set logger
          // Make sure we have a valid name field
          const validExercise = {
            ...exercise,
            name: exercise.name || 'Unknown Exercise'
          };
          console.log('Selected exercise:', validExercise);
          setCurrentExercise(validExercise);
          setView('setLogger');
        }}
        category={selectedCategory}
      />
    );
  }  if (view === 'calendar') {
    return (      <Calendar 
        selectedDate={selectedDate || new Date()}
        onClose={() => setView('main')}
        onSelectExercises={handleSelectExercisesFromDay}
        onDateSelect={(_) => {
          // This ensures that when a date is selected in the calendar,
          // any exercise added will be logged for that day
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

  if (view === 'program') {
    return (
      <ProgramManager
        onClose={() => setView('main')}
        onProgramSelected={handleProgramSelected}
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
              onClick={() => setView('program')}
              className="bg-[#2a1f42] p-4 rounded-xl hover:bg-[#3a2f52] transition-colors flex flex-col items-center"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-purple-400 font-medium">From program</div>
            </button>

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
        </div>
      </div>
    </div>
  );
};

export default LogOptions;
