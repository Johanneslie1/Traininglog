import React, { useState } from 'react';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; sets: number; reps: number; weight?: number; restTime?: number; notes?: string }) => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(5);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [restTime, setRestTime] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, sets, reps, weight, restTime, notes });
    setName('');
    setSets(3);
    setReps(5);
    setWeight(undefined);
    setRestTime(undefined);
    setNotes('');
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <form onSubmit={handleSubmit} className="bg-[#23272F] p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Add Exercise</h2>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Exercise Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            className="w-1/2 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
            placeholder="Sets"
            value={sets}
            min={1}
            onChange={e => setSets(Number(e.target.value))}
            required
          />
          <input
            type="number"
            className="w-1/2 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
            placeholder="Reps"
            value={reps}
            min={1}
            onChange={e => setReps(Number(e.target.value))}
            required
          />
        </div>
        <input
          type="number"
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Weight (kg)"
          value={weight ?? ''}
          onChange={e => setWeight(Number(e.target.value) || undefined)}
        />
        <input
          type="number"
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Rest Time (sec)"
          value={restTime ?? ''}
          onChange={e => setRestTime(Number(e.target.value) || undefined)}
        />
        <textarea
          className="w-full mb-4 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
        </div>
      </form>
    </div>
  );
};

export default ExerciseModal;
