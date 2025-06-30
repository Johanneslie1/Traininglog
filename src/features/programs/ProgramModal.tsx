import React, { useState } from 'react';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; level: string; description: string }) => void;
}

const levels = ['Any', 'Beginner', 'Intermediate', 'Advanced'];

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Any');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProgramModal] handleSubmit called with:', { name, level, description });
    onSave({ name, level, description });
    setName('');
    setLevel('Any');
    setDescription('');
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <form onSubmit={handleSubmit} className="bg-[#23272F] p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Add Program</h2>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Program Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          id="program-name"
          name="program-name"
        />
        <select
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          value={level}
          onChange={e => setLevel(e.target.value)}
          id="program-level"
          name="program-level"
        >
          {levels.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <textarea
          className="w-full mb-4 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          id="program-description"
          name="program-description"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
        </div>
      </form>
    </div>
  );
};

export default ProgramModal;
