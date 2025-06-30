import React, { useState } from 'react';
import { ProgramSession, ProgramExercise } from '@/types/program';
import ExerciseLogOptionsForm, { ExerciseWithSets } from '../exercises/ExerciseLogOptionsForm';
import SessionExerciseLogOptions, { ExerciseWithSets as SessionExerciseWithSets } from './SessionExerciseLogOptions';
import { ExerciseSetLogger } from '../exercises/ExerciseSetLogger';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: ProgramSession) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);



  // Add a single exercise (from SessionExerciseLogOptions)
  const handleAddExercise = (exercise: SessionExerciseWithSets) => {
    setExercises(prev => [...prev, exercise]);
    setShowAddExercise(false);
  };

  // Edit an exercise's sets
  const handleEditExercise = (sets: any[]) => {
    if (editIndex === null) return;
    setExercises(prev => prev.map((ex, idx) => idx === editIndex ? { ...ex, sets } : ex));
    setEditIndex(null);
  };

  // For batch edit (legacy, keep for now)
  const handleSaveExercises = (exs: ExerciseWithSets[]) => {
    setExercises(exs);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    // Convert ExerciseWithSets to ProgramExercise[] for saving in session
    const sessionExercises = exercises.map(ex => ({
      id: (!ex.id || ex.id.startsWith('temp-')) ? crypto.randomUUID() : ex.id,
      name: ex.name,
      sets: ex.sets.length > 0 ? ex.sets.length : 3,
      reps: ex.sets[0]?.reps || 10
    }));
    onSave({ id: crypto.randomUUID(), name, exercises: sessionExercises });
    setName('');
    setExercises([]);
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
        <div className="mb-4">
          <h3 className="text-white mb-2">Exercises</h3>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setShowAddExercise(true)} className="px-3 py-1 bg-green-700 text-white rounded">Add Exercise</button>
            <button type="button" onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-700 text-white rounded">Edit All</button>
          </div>
          {exercises.length === 0 && <div className="text-gray-500">No exercises added yet.</div>}
          <ul>
            {exercises.map((ex, idx) => (
              <li key={ex.id || idx} className="text-gray-200 text-sm mb-1 flex items-center gap-2">
                {ex.name} - {ex.sets.length} sets
                <button type="button" className="text-blue-400 ml-2" onClick={() => setEditIndex(idx)}>Edit</button>
                <button type="button" className="text-red-400 ml-2" onClick={() => setExercises(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
        </div>
      </form>
      {showForm && (
        <>
          {typeof editIndex === 'number' && exercises[editIndex] && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-60">
              <div className="bg-[#23272F] p-6 rounded-lg w-full max-w-md shadow-lg">
                <ExerciseSetLogger
                  exercise={exercises[editIndex]}
                  onSave={handleEditExercise}
                  onCancel={() => setEditIndex(null)}
                />
              </div>
            </div>
          )}
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-60">
            <div className="bg-[#23272F] p-6 rounded-lg w-full max-w-md shadow-lg">
              <ExerciseLogOptionsForm
                initialExercises={exercises}
                onSave={handleSaveExercises}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </>
      )}
      {showAddExercise && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-60">
          <div className="bg-[#23272F] p-6 rounded-lg w-full max-w-md shadow-lg">
            <SessionExerciseLogOptions
              onSave={handleAddExercise}
              onClose={() => setShowAddExercise(false)}
              onCopyFromAnotherDay={() => {/* TODO: implement copy from another day */}}
              onCopyPreviousSession={() => {/* TODO: implement copy previous session */}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionModal;
