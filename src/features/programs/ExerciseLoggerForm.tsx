import React, { useState } from 'react';
import { ProgramExercise } from '@/types/program';

interface ExerciseLoggerFormProps {
  initialExercises?: ProgramExercise[];
  onSave: (exercises: ProgramExercise[]) => void;
  onCancel: () => void;
}

const ExerciseLoggerForm: React.FC<ExerciseLoggerFormProps> = ({ initialExercises = [], onSave, onCancel }) => {
  const [exercises, setExercises] = useState<ProgramExercise[]>(initialExercises);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);

  const addExercise = () => {
    if (!exerciseName) return;
    setExercises([
      ...exercises,
      { id: crypto.randomUUID(), name: exerciseName, sets, reps }
    ]);
    setExerciseName('');
    setSets(3);
    setReps(10);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(exercises);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Exercises</h3>
        {exercises.length === 0 && <div className="text-gray-500">No exercises added yet.</div>}
        <ul>
          {exercises.map(ex => (
            <li key={ex.id} className="flex items-center gap-2 text-gray-200 text-sm mb-1">
              {ex.name} - {ex.sets} x {ex.reps}
              <button type="button" onClick={() => removeExercise(ex.id)} className="ml-2 text-red-400">Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-2 py-1 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Exercise Name"
          value={exerciseName}
          onChange={e => setExerciseName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="w-16 px-2 py-1 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Sets"
          value={sets}
          onChange={e => setSets(Number(e.target.value))}
        />
        <input
          type="number"
          min={1}
          className="w-16 px-2 py-1 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Reps"
          value={reps}
          onChange={e => setReps(Number(e.target.value))}
        />
        <button type="button" onClick={addExercise} className="px-2 py-1 bg-blue-600 text-white rounded">Add</button>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
      </div>
    </form>
  );
};

export default ExerciseLoggerForm;
