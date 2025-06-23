import React, { useState } from 'react';
import ExerciseSearch from './ExerciseSearch';
import Calendar from './Calendar';
import ProgramManager from './ProgramManager';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { db } from '@/services/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { getDeviceId, saveExerciseLog } from '@/utils/localStorageUtils';
import { Program, ExerciseLog, ExerciseSet, DifficultyCategory } from '@/types/exercise';

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
  const [recentExercises, setRecentExercises] = useState<ExerciseLog[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any>(null);  // Simple placeholder for recent exercises button
  const fetchRecentExercises = () => {
    // This would normally load recent exercises
    // This function is simplified since we've removed the exercise loading logic
    setView('search');
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setView('search');
  };

  const handleSelectExercisesFromDay = (exercises: ExerciseLog[]) => {
    setRecentExercises(exercises);
    setView('main');
  };  
  
  const addExerciseToToday = async (exercise: ExerciseLog) => {
    try {
      const deviceId = getDeviceId();
      
      // Create the exercise log with the device ID
      const newExercise = {
        ...exercise,
        timestamp: selectedDate || new Date(),
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
      alert('Failed to add exercise to today.');    }
  };  
  
  const handleSaveSets = async (sets: ExerciseSet[]) => {
    if (!currentExercise) return;
    
    try {      const deviceId = getDeviceId();
      
      const exerciseLog = {
        exerciseName: currentExercise.name,
        sets: sets,
        timestamp: selectedDate || new Date(),
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
          difficulty: 'NORMAL' as DifficultyCategory        }));
        
        const exerciseLog = {
          exerciseName: programExercise.name,
          sets,
          timestamp: selectedDate || new Date(),
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
  }  if (view === 'calendar') {
    return (
      <Calendar 
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
