import React, { useState, useEffect, useRef } from 'react';
import { useSupersets } from '../context/SupersetContext';

interface SupersetActionsButtonProps {
  exerciseId: string;
}

const SupersetActionsButton: React.FC<SupersetActionsButtonProps> = ({ exerciseId }) => {
  const { 
    getSupersetByExercise,
    breakSuperset,
    renameSuperset
  } = useSupersets();
  
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const superset = getSupersetByExercise(exerciseId);
  const isInSuperset = !!superset;

  // Initialize new name when starting to rename
  useEffect(() => {
    if (isRenaming && superset) {
      setNewName(superset.name || 'Superset');
      // Focus the input after it renders
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isRenaming, superset]);

  const handleBreakSuperset = () => {
    if (superset) {
      breakSuperset(superset.id);
      setShowActions(false);
    }
  };

  const handleRenameSuperset = () => {
    if (superset && newName.trim()) {
      renameSuperset(superset.id, newName.trim());
      setIsRenaming(false);
      setShowActions(false);
    }
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showActions) {
        // Don't close if we're clicking inside the rename input
        if (isRenaming && inputRef.current?.contains(e.target as Node)) {
          return;
        }
        setShowActions(false);
        setIsRenaming(false);
      }
    };
    
    if (showActions) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showActions, isRenaming]);

  if (!isInSuperset) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-500 bg-blue-500/10 rounded-full hover:bg-blue-500/20 transition-colors"
        aria-label="Superset Actions"
      >
        <span>{superset?.name || 'Superset'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showActions && (
        <div className="absolute z-20 mt-1 right-0 bg-bg-secondary border border-border rounded-lg shadow-xl p-2 min-w-[180px]">
          {isRenaming ? (
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2 py-1 bg-bg-tertiary text-text-primary rounded border border-accent-primary focus:outline-none"
                placeholder="Superset name"
                maxLength={30}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSuperset();
                  } else if (e.key === 'Escape') {
                    setIsRenaming(false);
                  }
                }}
              />
              <div className="flex justify-end mt-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(false);
                  }}
                  className="text-xs text-gray-400 hover:text-text-primary px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameSuperset();
                  }}
                  className="text-xs bg-accent-primary text-text-primary px-2 py-1 rounded hover:bg-accent-secondary transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBreakSuperset();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-text-primary hover:bg-white/10 rounded transition-colors text-left"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Break Superset
              </button>
              
              <button
                onClick={handleRenameClick}
                className="flex w-full items-center gap-2 px-3 py-2 text-text-primary hover:bg-white/10 rounded transition-colors text-left"
              >
                <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Rename
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SupersetActionsButton;
