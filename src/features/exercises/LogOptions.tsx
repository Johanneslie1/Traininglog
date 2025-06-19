import React, { useState } from 'react';
import ExerciseSearch from './ExerciseSearch';
import Calendar from './Calendar';
import ProgramManager from './ProgramManager';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { db } from '@/services/firebase/config';
import { collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { getDeviceId, saveExerciseLog, getExerciseLogs } from '@/utils/localStorageUtils';
import { Program } from '@/types/exercise';

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
}

import { DifficultyCategory } from './ExerciseSetLogger';

interface Exercise {
  id: string;
  exerciseName: string;
  timestamp: Date;
  sets: Array<{
    reps: number;
    weight: number;
    difficulty?: DifficultyCategory;
    rpe?: number;
  }>;
}

// Used in handleSaveSets function
type ExerciseSet = {
  reps: number;
  weight: number;
  difficulty?: DifficultyCategory;
  rpe?: number;
};

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', bgColor: 'bg-[#222]', iconBgColor: 'bg-green-600', textColor: 'text-white' },
  { id: 'back', name: 'Back', icon: '🔙', bgColor: 'bg-[#222]', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'legs', name: 'Legs', icon: '🦵', bgColor: 'bg-[#222]', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', bgColor: 'bg-[#222]', iconBgColor: 'bg-cyan-600', textColor: 'text-white' },
  { id: 'arms', name: 'Arms', icon: '💪', bgColor: 'bg-[#222]', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'core', name: 'Core', icon: '⭕', bgColor: 'bg-[#222]', iconBgColor: 'bg-purple-600', textColor: 'text-white' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', bgColor: 'bg-[#222]', iconBgColor: 'bg-orange-600', textColor: 'text-white' },
];

const trainingTypes: Category[] = [
  { id: 'cardio', name: 'Cardio', icon: '🏃', bgColor: 'bg-[#222]', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'agility', name: 'Agility', icon: '⚡', bgColor: 'bg-[#222]', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'speed', name: 'Speed', icon: '🏃‍♂️', bgColor: 'bg-[#222]', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'stretching', name: 'Stretching', icon: '🧘‍♂️', bgColor: 'bg-[#222]', iconBgColor: 'bg-green-600', textColor: 'text-white' },
];

export const LogOptions: React.FC<LogOptionsProps> = ({ onClose, onExerciseAdded }) => {
  const [view, setView] = useState<'main' | 'search' | 'calendar' | 'setLogger' | 'program'>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any>(null);const fetchRecentExercises = async () => {
    try {
      // Get logs from local storage
      const allLogs = getExerciseLogs();
      
      // Sort by timestamp (newest first) and take the most recent 5
      const recentLogs = [...allLogs]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5)
        .map(log => ({
          id: log.id || 'temp-id',
          exerciseName: log.exerciseName,
          sets: log.sets,
          timestamp: log.timestamp
        }));
      
      setRecentExercises(recentLogs);
      
      // Optionally, also try to fetch from Firebase as a backup
      try {
        const exercisesRef = collection(db, 'exerciseLogs');
        const q = query(
          exercisesRef,
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(q);
        const firebaseExercises = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as Exercise[];
        
        // Combine local and Firebase exercises if necessary
        if (recentLogs.length === 0 && firebaseExercises.length > 0) {
          setRecentExercises(firebaseExercises);
        }
      } catch (firebaseError) {
        console.error('Error fetching from Firebase, using local data only:', firebaseError);
      }
    } catch (error) {
      console.error('Error fetching recent exercises:', error);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setView('search');
  };

  const handleSelectExercisesFromDay = (exercises: Exercise[]) => {
    setRecentExercises(exercises);
    setView('main');
  };  const addExerciseToToday = async (exercise: Exercise) => {
    try {
      const deviceId = getDeviceId();
      
      // Create the exercise log with the device ID
      const newExercise = {
        ...exercise,
        timestamp: new Date(),
        deviceId
      };
      
      // Save to local storage
      saveExerciseLog(newExercise);
        // Also save to Firebase (optional, for backup)
      try {
        // Remove id so Firestore generates a new one
        const { id, ...exerciseData } = newExercise;
        await addDoc(collection(db, 'exerciseLogs'), exerciseData);
      } catch (firebaseError) {
        console.error('Failed to save to Firebase, but saved locally:', firebaseError);
      }
      
      // Notify parent that an exercise was added
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose(); // Close modal after adding
    } catch (error) {
      console.error('Failed to add exercise:', error);
      alert('Failed to add exercise to today.');
    }
  };  const handleSaveSets = async (sets: ExerciseSet[]) => {
    if (!currentExercise) return;
    
    try {
      const deviceId = getDeviceId();
      
      const exerciseLog = {
        exerciseName: currentExercise.name,
        sets: sets,
        timestamp: new Date(),
        deviceId
      };
      
      // Save to local storage
      saveExerciseLog(exerciseLog);
        // Also save to Firebase (optional, for backup)
      try {
        console.log('Adding exercise log:', exerciseLog);
        await addDoc(collection(db, 'exerciseLogs'), exerciseLog);
      } catch (firebaseError) {
        console.error('Failed to save to Firebase, but saved locally:', firebaseError);
      }
      
      // Notify parent that an exercise was added
      if (onExerciseAdded) {
        onExerciseAdded();
      }
      
      onClose(); // Close modal after adding
    } catch (error) {
      console.error('Error saving exercise with sets:', error);
      alert('Failed to add exercise to today.');
    }
  };

  const handleProgramSelected = (program: Program) => {
    // When a program is selected, we want to add each exercise with empty sets
    try {
      const deviceId = getDeviceId();
      
      // For each exercise in the program, create an exercise log
      program.exercises.forEach(async (programExercise) => {
        // Create empty sets based on the number specified in the program
        const sets = Array(programExercise.sets).fill(null).map(() => ({
          reps: 0,
          weight: 0,
          difficulty: 'NORMAL' as DifficultyCategory
        }));
        
        const exerciseLog = {
          exerciseName: programExercise.exerciseName,
          sets,
          timestamp: new Date(),
          deviceId
        };
        
        // Save to local storage
        saveExerciseLog(exerciseLog);
        
        // Optionally save to Firebase as backup
        try {
          await addDoc(collection(db, 'exerciseLogs'), exerciseLog);
        } catch (firebaseError) {
          console.error('Failed to save to Firebase, but saved locally:', firebaseError);
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
  }

  if (view === 'calendar') {
    return (
      <Calendar 
        onClose={() => setView('main')}
        onSelectExercises={handleSelectExercisesFromDay}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end">
      <div className="bg-[#1a1a1a] w-full p-4 rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="text-2xl text-white mb-6 px-2">Exercises</div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">          <button 
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

        <div className="grid grid-cols-2 gap-4 mb-6">          <button 
            onClick={fetchRecentExercises}
            className="bg-[#1a2942] p-4 rounded-xl hover:bg-[#2a3952] transition-colors flex flex-col items-center"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-blue-400 font-medium">Recent exercises</div>
          </button>
          
          <button 
            onClick={() => setView('search')}
            className="bg-[#1f2e42] p-4 rounded-xl hover:bg-[#2f3e52] transition-colors flex flex-col items-center"
          >
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-cyan-400 font-medium">Add exercise</div>
          </button>
        </div>

        {/* Muscle Groups */}
        <div className="mb-4">
          <h3 className="text-lg text-white mb-2">Muscle Groups</h3>
          <div className="space-y-2">
            {muscleGroups.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`flex items-center w-full p-3 ${category.bgColor} rounded-xl hover:bg-opacity-90 transition-colors`}
              >
                <div className={`w-8 h-8 ${category.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-white">{category.icon}</span>
                </div>
                <span className={category.textColor}>{category.name}</span>
                <span className="ml-auto text-gray-400">•••</span>
              </button>
            ))}
          </div>
        </div>

        {/* Training Types */}
        <div className="mb-4">
          <h3 className="text-lg text-white mb-2">Training Types</h3>
          <div className="space-y-2">
            {trainingTypes.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`flex items-center w-full p-3 ${category.bgColor} rounded-xl hover:bg-opacity-90 transition-colors`}
              >
                <div className={`w-8 h-8 ${category.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-white">{category.icon}</span>
                </div>
                <span className={category.textColor}>{category.name}</span>
                <span className="ml-auto text-gray-400">•••</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Exercises List */}
        {recentExercises.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg text-white mb-2">Recent Exercises</h3>
            <div className="space-y-2">
              {recentExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  className="p-3 bg-[#222] rounded-xl w-full text-left hover:bg-[#333] transition-colors"
                  onClick={() => addExerciseToToday(exercise)}
                >
                  <div className="text-white">{exercise.exerciseName}</div>
                  <div className="text-sm text-gray-400">
                    {exercise.timestamp.toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Button */}
        <button 
          onClick={onClose}
          className="w-full mt-4 p-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default LogOptions;
