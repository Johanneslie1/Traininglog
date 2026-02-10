import React, { useState, useEffect } from 'react';
import { Program } from '@/types/program';
import { getAuth } from 'firebase/auth';
import { usePersistedFormState } from '@/hooks/usePersistedState';

interface CreateNewProgramProps {
  onClose: () => void;
  onSave: (program: Omit<Program, 'id' | 'userId'>) => void;
}

interface CreateProgramFormState {
  programName: string;
  programDescription: string;
}

const CreateNewProgram: React.FC<CreateNewProgramProps> = ({
  onClose,
  onSave
}) => {
  const [persistedState, setPersistedState, clearPersistedState] = usePersistedFormState<CreateProgramFormState>(
    'create-new-program',
    {
      programName: '',
      programDescription: '',
    }
  );

  const [programName, setProgramName] = useState(persistedState.programName);
  const [programDescription, setProgramDescription] = useState(persistedState.programDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update persisted state when form values change
  useEffect(() => {
    setPersistedState({
      programName,
      programDescription,
    });
  }, [programName, programDescription, setPersistedState]);

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
      
      // Clear persisted form data after successful save
      clearPersistedState();
      console.log('[CreateNewProgram] Cleared persisted form data');
      
      onSave(program);
    } catch (error) {
      console.error('[CreateNewProgram] Error creating program:', error);
      alert('Failed to create program. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-primary bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-bg-secondary rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">Create New Program</h2>
            <button 
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary text-2xl"
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
              className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:outline-none"
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
              className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:outline-none resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary hover:opacity-90 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveProgram}
            disabled={!programName.trim() || isSubmitting}
            className="px-6 py-3 bg-accent-primary hover:bg-accent-secondary text-text-primary rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNewProgram;
