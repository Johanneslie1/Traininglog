import React, { useState } from 'react';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
}

const RoutineModal: React.FC<RoutineModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name });
    setName('');
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <form onSubmit={handleSubmit} className="bg-[#23272F] p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Add Routine</h2>
        <input
          className="w-full mb-4 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Routine Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
        </div>
      </form>
    </div>
  );
};

export default RoutineModal;
