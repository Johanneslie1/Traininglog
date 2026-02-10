import React, { useState, useEffect } from 'react';

interface SupersetNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

const SupersetNameModal: React.FC<SupersetNameModalProps> = ({ isOpen, onClose, onSave }) => {
  const [supersetName, setSupersetName] = useState('');
  
  // Reset name when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSupersetName('');
    }
  }, [isOpen]);
  
  // Handle keyboard interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, supersetName]);
  
  const handleSave = () => {
    onSave(supersetName);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
      <div 
        className="bg-bg-secondary rounded-xl p-6 shadow-xl w-[90%] max-w-md border border-accent-primary/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-text-primary">Name Your Superset</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <label htmlFor="supersetName" className="block text-sm text-gray-400 mb-2">
            Superset Name (optional)
          </label>
          <input
            id="supersetName"
            type="text"
            value={supersetName}
            onChange={(e) => setSupersetName(e.target.value)}
            placeholder="e.g., Chest & Back, Upper Body, etc."
            className="w-full px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:outline-none transition-colors"
            autoFocus
            maxLength={30}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-text-primary rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-text-primary rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
            </svg>
            Create Superset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupersetNameModal;
