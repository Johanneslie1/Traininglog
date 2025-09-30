import React, { useState } from 'react';
import { Program } from '@/types/program';
import { getAuth } from 'firebase/auth';

interface CreateNewProgramProps {
  onClose: () => void;
  onSave: (program: Omit<Program, 'id' | 'userId'>) => void;
}

const CreateNewProgram: React.FC<CreateNewProgramProps> = ({
  onClose,
  onSave
}) => {
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveProgram = async () => {
    if (!programName.trim()) {
      alert('Please enter a program name');
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        alert('You must be logged in to create a program');
        return;
      }

      const program: Omit<Program, 'id' | 'userId'> = {
        name: programName.trim(),
        description: programDescription.trim(),
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sessions: [],
        isPublic: false,
        tags: []
      };

      console.log('[CreateNewProgram] Creating program:', program);
      onSave(program);
    } catch (error) {
      console.error('[CreateNewProgram] Error creating program:', error);
      alert('Failed to create program. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-[#23272F] rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create New Program</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Program Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Push/Pull/Legs, Upper/Lower Split"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-4 py-3 bg-[#181A20] text-white rounded-lg border border-white/10 focus:border-[#8B5CF6] focus:outline-none"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe your program goals, frequency, and notes..."
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              className="w-full px-4 py-3 bg-[#181A20] text-white rounded-lg border border-white/10 focus:border-[#8B5CF6] focus:outline-none resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveProgram}
            disabled={!programName.trim() || isSubmitting}
            className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNewProgram;