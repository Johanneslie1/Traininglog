import React from 'react';
import { TrainingType } from '@/types/exercise';
import { TRAINING_TYPE_CONFIG } from '@/config/trainingTypeConfig';

interface Props {
  onSelect: (trainingType: TrainingType) => void;
}

export const TrainingTypeSelector: React.FC<Props> = ({ onSelect }) => {
  const trainingTypes = Object.values(TrainingType);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {trainingTypes.map((type: string) => {
        const config = TRAINING_TYPE_CONFIG[type as TrainingType];
        return (
          <button
            key={type}
            onClick={() => onSelect(type as TrainingType)}
            className="p-4 bg-gray-700 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-600 transition"
          >
            <div className="text-3xl mb-2">{config.icon}</div>
            <h3 className="text-white font-semibold text-sm mb-1">{config.label}</h3>
            <p className="text-xs text-gray-400">{config.description}</p>
          </button>
        );
      })}
    </div>
  );
};
