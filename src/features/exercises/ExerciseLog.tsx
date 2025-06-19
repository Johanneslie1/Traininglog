import React, { useState, useEffect } from 'react';
import LogOptions from './LogOptions';
import Calendar from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { exportExerciseData, importExerciseData } from '@/utils/exportUtils';
import { getExerciseLogsByDate, saveExerciseLog } from '@/utils/localStorageUtils';

// Import difficulty type
import { DifficultyCategory } from './ExerciseSetLogger';

interface Exercise {
  id: string;
  exerciseName: string;
  sets: Array<{
    reps: number;
    weight: number;
    difficulty?: DifficultyCategory;
    rpe?: number; // Keep for backward compatibility
  }>;
  timestamp: Date;
}

export const ExerciseLog: React.FC = () => {
  const [showLogOptions, setShowLogOptions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSetLogger, setShowSetLogger] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const fetchExercises = async (date: Date) => {
    setLoading(true);

    try {
      // First, get exercises from local storage for the selected date
      const localExercises = getExerciseLogsByDate(date);
      
      // If we have local exercises, use them
      if (localExercises.length > 0) {
        setExercises(localExercises.map(exercise => ({
          id: exercise.id || 'local-id',
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          timestamp: exercise.timestamp
        })));
        setLoading(false);
        return;
      }
      
      // As a fallback, try to get exercises from Firebase
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const exercisesRef = collection(db, 'exerciseLogs');
      const q = query(
        exercisesRef,
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );

      const snapshot = await getDocs(q);
      const exerciseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as Exercise[];

      setExercises(exerciseData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises(selectedDate);
  }, [selectedDate]);  
  
  // Handle file upload for import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    try {
      const success = await importExerciseData(file);
      if (success) {
        alert('Exercise data imported successfully!');
        fetchExercises(selectedDate); // Refresh the exercises
      } else {
        alert('Failed to import exercise data. Please check the file format.');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('An error occurred while importing the data.');
    } finally {
      setShowImportModal(false);
    }
  };

  const handleDateSelect = (exercises: Exercise[]) => {
    setExercises(exercises);
    setShowCalendar(false);
  };

  const handleOpenSetLogger = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowSetLogger(true);
  };

  const handleCloseSetLogger = () => {
    setShowSetLogger(false);
    setSelectedExercise(null);
  };
  const handleSaveSets = (sets: Array<{ reps: number; weight: number; rpe?: number }>) => {
    if (!selectedExercise) return;
    
    // Update the exercise with new sets
    const updatedExercise = {
      ...selectedExercise,
      sets,
      deviceId: localStorage.getItem('device_id') || '',
    };
    
    // Save to local storage
    saveExerciseLog(updatedExercise);
    
    // Update exercises in state immediately for fast UI response
    setExercises(prevExercises => prevExercises.map(ex => 
      ex.id === selectedExercise.id 
        ? { ...ex, sets } 
        : ex
    ));
    
    // Also refresh from storage to ensure everything is synced
    fetchExercises(selectedDate);
    
    // Close the set logger
    handleCloseSetLogger();
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-black">      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <button className="text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1 flex justify-center">
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="text-white text-xl font-medium"
          >
            {formatDate(selectedDate)}
          </button>
        </div><div className="flex items-center gap-4">
          <button
            onClick={() => exportExerciseData(exercises)}
            className="text-white p-2 hover:text-green-500 transition-colors"
            aria-label="Export"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="text-white p-2 hover:text-yellow-500 transition-colors"
            aria-label="Import"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className={`text-white p-2 transition-colors ${showCalendar ? 'text-blue-500' : 'hover:text-blue-500'}`}
            aria-label="Calendar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>      {/* Exercise List or Empty State */}
      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : exercises.length > 0 ? (
        <div className="p-0 space-y-1">
          {exercises.map((exercise) => (
            <div 
              key={exercise.id}
              className="border-b border-gray-800 p-4"
            >              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white text-lg font-medium">{exercise.exerciseName}</h3>
                <div className="flex space-x-2">
                  <button 
                    className="text-white p-2 hover:text-green-500 transition-colors"
                    onClick={() => handleOpenSetLogger(exercise)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button className="text-white p-2 hover:text-gray-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>                <div className="grid grid-cols-3 gap-2">
                {exercise.sets.map((set, index) => {
                  // Determine background color based on difficulty
                  let bgColor = 'bg-[#222]';
                  let textColor = 'text-white';
                  
                  if (set.difficulty) {
                    switch (set.difficulty) {
                      case 'WARMUP': bgColor = 'bg-blue-900'; break;
                      case 'EASY': bgColor = 'bg-green-900'; break;
                      case 'NORMAL': bgColor = 'bg-yellow-900'; break;
                      case 'HARD': bgColor = 'bg-red-900'; break;
                      case 'FAILURE': bgColor = 'bg-amber-800'; break;
                      case 'DROP': bgColor = 'bg-purple-900'; break;
                    }
                  } else if (set.rpe) {
                    // Legacy RPE-based coloring
                    if (set.rpe <= 3) bgColor = 'bg-blue-900';
                    else if (set.rpe <= 5) bgColor = 'bg-green-900';
                    else if (set.rpe <= 7) bgColor = 'bg-yellow-900';
                    else bgColor = 'bg-red-900';
                  }
                  
                  return (
                    <div key={index} className={`flex flex-col items-center ${bgColor} rounded-lg p-2`}>
                      <div className={`font-medium text-2xl ${textColor}`}>{set.weight} <span className="text-xs text-gray-300">KG</span></div>
                      <div className={`text-lg ${textColor}`}>{set.reps} <span className="text-xs text-gray-300">REP</span></div>
                      {set.difficulty && (
                        <div className="text-xs text-gray-300 mt-1">{set.difficulty}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh] text-gray-600">
          <div className="mb-4">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
              <text x="0" y="30" fontSize="40">zzz</text>
            </svg>
          </div>
          <div className="text-2xl">Empty Day</div>
          <p className="text-gray-500 mt-2">Start logging your exercises!</p>
        </div>
      )}      {/* Add Exercise Button */}
      <button
        onClick={() => setShowLogOptions(true)}
        className="fixed bottom-16 right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        aria-label="Add Exercise"
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>      {/* Log Options Modal */}
      {showLogOptions && (
        <LogOptions 
          onClose={() => setShowLogOptions(false)} 
          onExerciseAdded={() => fetchExercises(selectedDate)}
        />
      )}      {/* Calendar Dropdown */}
      {showCalendar && (
        <div className="absolute top-16 right-0 z-30 w-[300px] mr-2 shadow-lg">
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
            <Calendar 
              onClose={() => setShowCalendar(false)}
              onSelectExercises={(exercises) => {
                handleDateSelect(exercises);
                setShowCalendar(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl text-white font-bold mb-4">Import Exercise Data</h2>
            <p className="text-gray-300 mb-4">
              Select a JSON backup file to import your exercise data.
            </p>
            
            <div className="mb-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-white p-2 rounded bg-[#333]"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}      {/* Set Logger Modal */}
      {showSetLogger && selectedExercise && (
        <ExerciseSetLogger
          exercise={{
            id: selectedExercise.id,
            name: selectedExercise.exerciseName,
            sets: selectedExercise.sets
          }}
          onSave={handleSaveSets}
          onCancel={handleCloseSetLogger}
        />
      )}
    </div>
  );
};

export default ExerciseLog;
