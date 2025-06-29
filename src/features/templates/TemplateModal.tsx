import React, { useState, useEffect } from 'react';
import { Exercise, SessionTemplate } from '@/services/sessionTemplateService';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, exercises: Exercise[]) => void;
  template?: SessionTemplate;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSave, template }) => {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // Inline form state for new exercise
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: 0,
  });

  useEffect(() => {
    if (template && isOpen) {
      setName(template.name);
      setExercises(template.exercises);
    } else if (isOpen) {
      setName('');
      setExercises([]);
    }
  }, [template, isOpen]);

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;
    setExercises(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...newExercise,
      },
    ]);
    setNewExercise({ name: '', sets: 3, reps: 10, weight: 0 });
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#23272F] rounded-xl p-6 w-full max-w-lg border border-white/10">
        <h2 className="text-xl font-bold mb-4 text-white">{template ? 'Edit Template' : 'Create New Template'}</h2>
        <input
          className="w-full mb-4 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Template Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {/* Exercise add/remove UI */}
        <div className="mb-4">
          <div className="mb-2 font-medium text-white">Exercises in Template</div>
          {exercises.length === 0 && (
            <div className="text-gray-400 text-sm mb-2">No exercises added yet.</div>
          )}
          <ul className="space-y-2 mb-4">
            {exercises.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between bg-[#181A20] rounded px-3 py-2">
                <div>
                  <span className="font-semibold text-white">{ex.name}</span>
                  <span className="text-gray-400 text-xs ml-2">{ex.sets} sets × {ex.reps} reps @ {ex.weight}kg</span>
                </div>
                <button
                  className="ml-2 px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-500 text-white"
                  onClick={() => handleRemoveExercise(ex.id)}
                  aria-label={`Remove ${ex.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col md:flex-row gap-2 items-end">
            <input
              className="flex-1 px-2 py-1 rounded bg-[#23272F] text-white border border-white/10"
              placeholder="Exercise Name"
              value={newExercise.name}
              onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
            />
            <input
              type="number"
              min={1}
              className="w-16 px-2 py-1 rounded bg-[#23272F] text-white border border-white/10"
              placeholder="Sets"
              value={newExercise.sets}
              onChange={e => setNewExercise({ ...newExercise, sets: Number(e.target.value) })}
            />
            <input
              type="number"
              min={1}
              className="w-16 px-2 py-1 rounded bg-[#23272F] text-white border border-white/10"
              placeholder="Reps"
              value={newExercise.reps}
              onChange={e => setNewExercise({ ...newExercise, reps: Number(e.target.value) })}
            />
            <input
              type="number"
              min={0}
              className="w-20 px-2 py-1 rounded bg-[#23272F] text-white border border-white/10"
              placeholder="Weight (kg)"
              value={newExercise.weight}
              onChange={e => setNewExercise({ ...newExercise, weight: Number(e.target.value) })}
            />
            <button
              className="px-3 py-1 bg-green-600 rounded-lg text-white font-medium hover:bg-green-500"
              onClick={handleAddExercise}
              disabled={!newExercise.name.trim()}
            >
              Add
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg text-white">Cancel</button>
          <button
            onClick={() => onSave(name, exercises)}
            className="px-4 py-2 bg-pink-600 rounded-lg text-white font-medium"
            disabled={!name.trim()}
          >
            {template ? 'Save Changes' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
