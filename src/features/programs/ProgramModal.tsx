import React, { useState } from 'react';
import { InlineErrorState } from '@/components/ui';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Program name is required');
      }

      console.log('[ProgramModal] Submitting program:', {
        name,
        description,
        timestamp: new Date().toISOString()
      });

      await onSave({ name, description });
      
      console.log('[ProgramModal] Program submitted successfully');
      
      // Reset form
      setName('');
      setDescription('');
      
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create program';
      console.error('[ProgramModal] Error submitting program:', {
        error: err,
        errorMessage,
        formData: { name, description }
      });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-primary bg-opacity-60 z-50">
      <form onSubmit={handleSubmit} className="bg-bg-secondary p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Add Program</h2>
        
        {error && (
          <InlineErrorState className="mb-4" title="Could not create program" message={error} />
        )}

        <input
          className="w-full mb-3 px-3 py-2 rounded bg-bg-tertiary text-text-primary border border-border"
          placeholder="Program Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          disabled={isSubmitting}
          id="program-name"
          name="program-name"
        />
        
        <textarea
          className="w-full mb-4 px-3 py-2 rounded bg-bg-tertiary text-text-primary border border-border"
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
            className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting} 
            className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-inverse rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin"></div>
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

