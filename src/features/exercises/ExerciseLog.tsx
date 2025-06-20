import React, { useState, useEffect } from 'react';
import LogOptions from './LogOptions';
import Calendar from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import WorkoutSummary from './WorkoutSummary';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { importExerciseData, exportExerciseData } from '@/utils/exportUtils';
import { getExerciseLogsByDate, saveExerciseLog, deleteExerciseLog } from '@/utils/localStorageUtils';
import ExerciseCard from '@/components/ExerciseCard';
import SideMenu from '@/components/SideMenu';

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
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    // Calendar component also calls setSelectedDate when a date is clicked
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

  const handleDeleteExercise = (exerciseId: string) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      // Delete from local storage
      const success = deleteExerciseLog(exerciseId);
      
      if (success) {
        // Update UI immediately
        setExercises(prevExercises => prevExercises.filter(ex => ex.id !== exerciseId));
      } else {
        alert('Failed to delete the exercise. Please try again.');
      }
    }
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('no-NO', { 
      day: 'numeric',
      month: 'long'
    }).toLowerCase();
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <button 
          className="text-white p-2"
          onClick={() => setShowMenu(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-white text-xl">{formatDate(selectedDate)}</h1>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setShowCalendar(!showCalendar)} className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (              <ExerciseCard
                key={exercise.id}
                name={exercise.exerciseName}
                sets={exercise.sets}
                onAdd={() => handleOpenSetLogger(exercise)}
                onDelete={() => handleDeleteExercise(exercise.id)}
              />
            ))}
          </div>
        )}
      </div>      {/* Add Exercise Button */}
      <button
        onClick={() => setShowLogOptions(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Side Menu */}
      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onImport={() => setShowImportModal(true)}
        onExport={() => exportExerciseData(exercises)}
        onShowWorkoutSummary={() => setShowWorkoutSummary(true)}
      />

      {/* Log Options Modal */}
      {showLogOptions && (
        <LogOptions 
          onClose={() => setShowLogOptions(false)} 
          onExerciseAdded={() => fetchExercises(selectedDate)}
          selectedDate={selectedDate}
        />
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="absolute top-16 right-0 z-30 w-[300px] mr-2 shadow-lg">
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#2d2d2d]">
            <Calendar 
              onClose={() => setShowCalendar(false)}
              onSelectExercises={handleDateSelect}
              onDateSelect={(date) => setSelectedDate(date)}
            />
          </div>
        </div>
      )}

      {/* Set Logger Modal */}
      {showSetLogger && selectedExercise && (
        <ExerciseSetLogger
          exercise={{
            id: selectedExercise.id,
            name: selectedExercise.exerciseName,
            sets: selectedExercise.sets
          }}
          onSave={handleSaveSets}
          onCancel={handleCloseSetLogger}
          isEditing={true}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full border border-[#2d2d2d]">
            <h2 className="text-xl text-white font-bold mb-4">Import Exercise Data</h2>
            <p className="text-gray-300 mb-4">
              Select a JSON backup file to import your exercise data.
            </p>
            
            <div className="mb-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-white p-2 rounded bg-[#2a2a2a] border border-[#3d3d3d]"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Summary Modal */}
      {showWorkoutSummary && exercises.length > 0 && (
        <WorkoutSummary
          exercises={exercises}
          onClose={() => setShowWorkoutSummary(false)}
        />
      )}
    </div>
  );
};

export default ExerciseLog;
