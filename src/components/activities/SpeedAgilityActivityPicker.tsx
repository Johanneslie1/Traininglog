import React from 'react';
import UniversalActivityLogger from './UniversalActivityLogger';
import { getDefaultTemplateByType } from '@/config/defaultTemplates';

interface SpeedAgilityActivityPickerProps {
  selectedDate: Date;
  onActivityLogged: () => void;
  initialActivityName?: string;
  editData?: any;
}

export const SpeedAgilityActivityPicker: React.FC<SpeedAgilityActivityPickerProps> = ({
  selectedDate,
  onActivityLogged,
  initialActivityName,
  editData
}) => {
  const template = getDefaultTemplateByType('speedAgility');

  if (!template) {
    return (
      <div className="text-center text-red-500 p-4">
        Speed & Agility template not found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚡</span>
        <h2 className="text-lg font-semibold text-gray-800">
          Speed & Agility Training
        </h2>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-700">
          Log speed training, agility drills, and quick movement patterns. 
          Track repetitions, times, distances, and perceived exertion.
        </p>
      </div>

      <UniversalActivityLogger
        template={template}
        activityName={initialActivityName || "Speed & Agility Training"}
        onClose={() => {}}
        onBack={() => {}}
        selectedDate={selectedDate}
        onActivityLogged={onActivityLogged}
        editingExercise={editData}
      />
    </div>
  );
};

export default SpeedAgilityActivityPicker;
