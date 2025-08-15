import React, { useState, useCallback } from 'react';
import { ProgramSession } from '@/types/program';
import SessionExerciseLogOptions, { ExerciseWithSets as SessionExerciseWithSets } from './SessionExerciseLogOptions';
import { getAuth } from 'firebase/auth';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: ProgramSession) => void;
  initialData?: ProgramSession;
}

const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [exercises, setExercises] = useState<SessionExerciseWithSets[]>(
    initialData?.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      description: '',
      type: 'strength',
      category: 'compound',
      primaryMuscles: [],
      secondaryMuscles: [],
      defaultUnit: 'kg',
      metrics: {
        trackWeight: true,
        trackReps: true
      },
      instructions: [],
      sets: [] // Empty sets - will be logged during workout
    })) || []
  );
  const [showAddExercise, setShowAddExercise] = useState(false);

  // Get current user ID
  const getCurrentUserId = useCallback(() => {
    const auth = getAuth();
    if (!auth.currentUser?.uid) {
      throw new Error('User must be logged in to perform this action');
    }
    return auth.currentUser.uid;
  }, []);

  // Add a single exercise (from SessionExerciseLogOptions)
  const handleAddExercise = (exercise: SessionExerciseWithSets) => {
    setExercises(prev => [...prev, exercise]);
    setShowAddExercise(false);
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter((ex, idx) => ex.id !== id && idx.toString() !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    try {
      const userId = getCurrentUserId();
      console.log('[SessionModal] Creating/updating session:', {
        isEdit: !!initialData,
        name,
        exerciseCount: exercises.length
      });
      
      // Convert ExerciseWithSets to proper format for saving
      const sessionExercises = exercises.map(ex => ({
        id: ex.id || '', // Ensure id is a string, server will replace if needed
        name: ex.name,
        sets: ex.sets.length || 3,
        reps: ex.sets[0]?.reps || 10,
        weight: ex.sets[0]?.weight || 0,
        setsData: ex.sets.map(set => ({
          reps: set.reps || 10,
          weight: typeof set.weight === 'number' ? set.weight : 0,
          difficulty: set.difficulty || 'MODERATE'
        }))
      }));
      
      const session: ProgramSession = {
        id: initialData?.id || '', // Server will replace this for new sessions
        name,
        exercises: sessionExercises,
        userId,
        order: initialData?.order ?? 0
      };

      console.log('[SessionModal] Saving session:', session);
      onSave(session);
      
      // Reset form
      setName('');
      setExercises([]);
      onClose();
    } catch (error) {
      console.error('[SessionModal] Error saving session:', error);
      alert(error instanceof Error ? error.message : 'Failed to save session');
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <form onSubmit={handleSubmit} className="bg-[#23272F] p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Add Session</h2>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Session Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <div className="mb-6">
          <h3 className="text-white text-lg font-medium mb-3">Exercises</h3>
          <button 
            type="button" 
            onClick={() => setShowAddExercise(true)} 
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-4"
          >
            Add Exercise
          </button>
          {exercises.length === 0 ? (
            <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-lg">
              No exercises added yet
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex, idx) => (
                <div key={ex.id || idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-200 font-medium">{ex.name}</span>
                  <button 
                    type="button" 
                    onClick={() => removeExercise(ex.id || idx.toString())}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
        </div>
      </form>
      
      {showAddExercise && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-60">
          <div className="bg-[#23272F] p-6 rounded-lg w-full max-w-md shadow-lg">
            <SessionExerciseLogOptions
              onSave={handleAddExercise}
              onClose={() => setShowAddExercise(false)}
              // Removed onCopyFromAnotherDay prop (feature removed)
              // Removed onCopyPreviousSession prop (feature removed from this context)
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionModal;
