import React, { useState } from 'react';
import { PlusIcon, ClockIcon, CollectionIcon, BookmarkIcon, SparklesIcon } from '@heroicons/react/outline';

interface QuickActionMenuProps {
  onAddFromHistory: () => void;
  onAddFromPrograms: () => void;
  onSaveTemplate: () => void;
  onGenerateAI?: () => void;
  disabled?: boolean;
}

const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  onAddFromHistory,
  onAddFromPrograms,
  onSaveTemplate,
  onGenerateAI,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Add from History',
      icon: ClockIcon,
      onClick: () => {
        onAddFromHistory();
        setIsOpen(false);
      },
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      label: 'Add from Programs',
      icon: CollectionIcon,
      onClick: () => {
        onAddFromPrograms();
        setIsOpen(false);
      },
      color: 'bg-accent-primary hover:bg-accent-hover'
    },
    {
      label: 'Save as Template',
      icon: BookmarkIcon,
      onClick: () => {
        onSaveTemplate();
        setIsOpen(false);
      },
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  if (onGenerateAI) {
    actions.push({
      label: 'AI Suggestions',
      icon: SparklesIcon,
      onClick: () => {
        onGenerateAI();
        setIsOpen(false);
      },
      color: 'bg-yellow-600 hover:bg-yellow-700'
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Action Buttons */}
      {isOpen && (
        <div className="mb-4 space-y-2">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center gap-3 opacity-0 animate-in slide-in-from-bottom duration-200"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <span className="text-white text-sm bg-black bg-opacity-70 px-2 py-1 rounded whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={action.onClick}
                disabled={disabled}
                className={`p-3 ${action.color} text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <action.icon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-4 bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default QuickActionMenu;
