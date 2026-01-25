import React, { useState } from 'react';
import { TrainingType, Exercise } from '@/types/exercise';
import { TRAINING_TYPE_CONFIG } from '@/config/trainingTypeConfig';

interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  trainingType: TrainingType;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  userId: string;
}

export const CreateCustomExerciseModal: React.FC<CreateCustomExerciseModalProps> = ({
  isOpen,
  trainingType,
  onClose,
  onSave,
  userId
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const config = TRAINING_TYPE_CONFIG[trainingType];

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    const newExercise: Exercise = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim() || '',
      trainingType,
      category: 'custom',
      metricsConfig: config.metricsConfig,
      instructions: [],
      customExercise: true,
      userId,
      
      isDefault: false
    };

    onSave(newExercise);
    setName('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-md space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {config.icon} Create Custom {config.label}
          </h2>
          <p className="text-xs text-gray-400 mt-1">{config.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Exercise Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Morning Run, Yoga Session"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              placeholder="Add any details or notes about this exercise..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 h-20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium transition-colors"
          >
            Create Exercise
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomExerciseModal;


