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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('[ProgramModal] handleSubmit called with:', { name, level, description });
      await onSave({ name, level, description });
      setName('');
      setLevel('Any');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program');
      console.error('[ProgramModal] Error creating program:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <form onSubmit={handleSubmit} className="bg-[#23272F] p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Add Program</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <input
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          placeholder="Program Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          disabled={isSubmitting}
          id="program-name"
          name="program-name"
        />
        
        <select
          className="w-full mb-3 px-3 py-2 rounded bg-[#181A20] text-white border border-white/10"
          value={level}
          onChange={e => setLevel(e.target.value)}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          id="program-description"
          name="program-description"
        />
        
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgramModal;
