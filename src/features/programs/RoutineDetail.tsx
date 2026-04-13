import React from 'react';

interface RoutineDetailProps {
  routine: { id: string; name: string; exercises: any[] };
  onAddExercise: () => void;
}

const RoutineDetail: React.FC<RoutineDetailProps> = ({ routine, onAddExercise }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-2">{routine.name}</h3>
      <button
        className="mb-4 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
        onClick={onAddExercise}
      >
        + Add Exercise
      </button>
      <ul className="space-y-2">
        {routine.exercises.map((ex, i) => (
          <li key={ex.id || i} className="bg-[#23272F] rounded p-3">
            <div className="font-semibold">{ex.name}</div>
            <div className="text-gray-400 text-sm">
              Sets: {ex.sets}, Reps: {ex.reps}, Weight: {ex.weight || '-'}kg, Rest: {ex.restTime || '-'}s
            </div>
            {ex.notes && <div className="text-xs text-gray-500 mt-1">{ex.notes}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoutineDetail;
