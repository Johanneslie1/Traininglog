import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import LogOptions from './LogOptions';
import Calendar from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import WorkoutSummary from './WorkoutSummary';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { exportExerciseData } from '@/utils/exportUtils';
import { getExerciseLogsByDate, saveExerciseLog, deleteExerciseLog } from '@/utils/localStorageUtils';
import { importExerciseLogs } from '@/utils/importUtils';
import ExerciseCard from '@/components/ExerciseCard';
import SideMenu from '@/components/SideMenu';
import { ExerciseSet, ExerciseLog as ExerciseLogType } from '@/types/exercise';
import { ExerciseData } from '@/services/exerciseDataService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// Convert local storage exercise to ExerciseData format
const convertToExerciseData = (exercise: Omit<ExerciseLogType, 'id'> & { id?: string }, userId: string): ExerciseData => ({
  id: exercise.id ?? uuidv4(), // Use nullish coalescing to generate new ID if none exists
  exerciseName: exercise.exerciseName,
  sets: exercise.sets,
  timestamp: new Date(exercise.timestamp),
  userId: userId,
  deviceId: exercise.deviceId || localStorage.getItem('device_id') || ''
});

// Convert ExerciseData to ExerciseLog format for export
const convertToExerciseLog = (exercise: ExerciseData): ExerciseLogType => ({
  id: exercise.id || uuidv4(), // Ensure ID is always present for export
  exerciseName: exercise.exerciseName,
  sets: exercise.sets,
  timestamp: exercise.timestamp,
  deviceId: exercise.deviceId
});

export const ExerciseLog: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [showLogOptions, setShowLogOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSetLogger, setShowSetLogger] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch exercises when date changes or user changes
  useEffect(() => {
    if (user?.id) {
      fetchExercises(selectedDate);
    }
  }, [selectedDate, user]);

  const fetchExercises = async (date: Date) => {
    if (!user) return;
    setLoading(true);

    try {
      // First, get exercises from local storage for the selected date
      const localExercises = getExerciseLogsByDate(date);
      
      // If we have local exercises, use them
      if (localExercises.length > 0) {
        setExercises(localExercises.map(exercise => convertToExerciseData(exercise, user.id)));
        setLoading(false);
        return;
      }
      
      // As a fallback, try to get exercises from Firebase
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'exerciseLogs'),
        where('userId', '==', user.id),
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );

      const snapshot = await getDocs(q);
      const fetchedExercises = snapshot.docs.map(doc => {
        const data = doc.data();
        return convertToExerciseData({
          id: doc.id,
          exerciseName: data.exerciseName,
          sets: data.sets,
          timestamp: data.timestamp.toDate(),
          deviceId: data.deviceId
        }, user.id);
      });

      setExercises(fetchedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    setSelectedDate(normalizedDate);
  };

  // Handle exercises selection from calendar
  const handleExercisesSelect = (selectedExercises: ExerciseData[]) => {
    setExercises(selectedExercises);
    // Don't automatically close the calendar - let the user decide when to close it
  };

  // Handle calendar open/close
  const toggleCalendar = (show?: boolean) => {
    setShowCalendar(prev => typeof show === 'boolean' ? show : !prev);
  };

  // Focus trap for calendar modal
  useEffect(() => {
    if (showCalendar) {
      // Trap focus within calendar modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          toggleCalendar(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showCalendar]);

  const handleOpenSetLogger = (exercise: ExerciseData) => {
    setSelectedExercise(exercise);
    setShowSetLogger(true);
  };

  const handleSaveSets = (sets: ExerciseSet[], exerciseId: string) => {
    if (!selectedExercise || !user) return;
    
    const updatedExercise: ExerciseData = {
      ...selectedExercise,
      sets,
      timestamp: selectedDate
    };

    saveExerciseLog(updatedExercise);

    setExercises(prevExercises => 
      prevExercises.map(ex => 
        ex.id === exerciseId ? updatedExercise : ex
      )
    );

    setShowSetLogger(false);
    setSelectedExercise(null);
  };

  const handleDeleteExercise = (exerciseId: string | undefined) => {
    if (!exerciseId) return;
    
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
  };  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const logs = await importExerciseLogs(file);
      if (logs && logs.length > 0) {
        // Convert imported logs to ExerciseData format
        setExercises(prevExercises => [
          ...prevExercises,
          ...logs.map(log => convertToExerciseData(log, user.id))
        ]);
      }
      setShowImportModal(false);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setShowMenu(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-medium">{formatDate(selectedDate)}</h1>
        </div>
        
        <div className="flex items-center">          <button 
            onClick={() => setShowCalendar(!showCalendar)} 
            className={`p-2 rounded-lg transition-colors ${showCalendar ? 'bg-white/10' : 'hover:bg-white/10'}`}
            aria-label="Open calendar"
            aria-expanded={showCalendar}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-24 pt-20">
        {loading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise) => {
              const isToday = new Date(exercise.timestamp).toDateString() === new Date().toDateString();
              return (
                <ExerciseCard
                  key={exercise.id}
                  name={exercise.exerciseName}
                  sets={exercise.sets}
                  onEdit={isToday ? () => handleOpenSetLogger(exercise) : undefined}
                  onDelete={isToday && exercise.id ? () => handleDeleteExercise(exercise.id) : undefined}
                  onAddSet={isToday ? () => handleOpenSetLogger(exercise) : undefined}
                  isToday={isToday}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Calendar Modal */}
      {showCalendar && (
        <div 
          className="fixed inset-0 z-40 overflow-hidden"
          onClick={(e) => {
            // Only close if clicking the overlay
            if (e.target === e.currentTarget) {
              toggleCalendar(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              toggleCalendar(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-title"
        >
          <div 
            className="fixed top-[72px] right-0 w-[300px] mr-4 shadow-lg"
            role="document"
          >
            <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h2 id="calendar-title" className="text-white font-medium">Calendar</h2>
                <button
                  onClick={() => toggleCalendar(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close calendar"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-[300px]" aria-live="polite">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white">
                    <span className="sr-only">Loading calendar data...</span>
                  </div>
                </div>
              ) : (
                <Calendar 
                  onClose={() => toggleCalendar(false)}
                  onSelectExercises={handleExercisesSelect}
                  onDateSelect={handleDateSelect}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowLogOptions(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-40"
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
        onExport={() => exportExerciseData(exercises.map(convertToExerciseLog))}
        onShowWorkoutSummary={() => setShowWorkoutSummary(true)}
        onNavigateToday={() => setSelectedDate(new Date())}
        onNavigateHistory={() => setShowCalendar(true)}
        onNavigatePrograms={() => {/* TODO: Implement programs navigation */}}
        onNavigateProfile={() => {/* TODO: Implement profile navigation */}}
      />

      {/* Log Options Modal */}
      {showLogOptions && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <LogOptions 
            onClose={() => setShowLogOptions(false)} 
            onExerciseAdded={() => fetchExercises(selectedDate)}
            selectedDate={selectedDate}
          />
        </div>
      )}

      {/* Set Logger Modal */}
      {showSetLogger && selectedExercise && selectedExercise.id && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <ExerciseSetLogger
            exercise={{
              id: selectedExercise.id,
              name: selectedExercise.exerciseName,
              sets: selectedExercise.sets.map(set => ({
                reps: set.reps,
                weight: set.weight || 0,
                difficulty: set.difficulty
              }))
            }}
            onSave={handleSaveSets}
            onCancel={() => setShowSetLogger(false)}
            isEditing={true}
          />
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white font-medium">Import Exercise Data</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 mb-4">
              Select a JSON backup file to import your exercise data.
            </p>
            <div className="mb-6">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-white p-3 rounded-xl bg-[#2a2a2a] border border-white/10 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Summary Modal */}
      {showWorkoutSummary && exercises.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <WorkoutSummary
            exercises={exercises.map(ex => ({
              id: ex.id || 'temp-id',
              exerciseName: ex.exerciseName,
              sets: ex.sets,
              timestamp: ex.timestamp
            }))}
            onClose={() => setShowWorkoutSummary(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseLog;
