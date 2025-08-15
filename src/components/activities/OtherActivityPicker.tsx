import React, { useState, useEffect } from 'react';
import { ActivityType, OtherActivity } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
import { otherTemplate } from '@/config/defaultTemplates';
import UniversalActivityLogger from './UniversalActivityLogger';
import UniversalExercisePicker from './UniversalExercisePicker';
import { enrich, collectFacets, applyFilters } from '@/utils/otherFilters';

interface OtherActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
}

const OtherActivityPicker: React.FC<OtherActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date()
}) => {
  const [data, setData] = useState<OtherActivity[]>([]);
  const [selected, setSelected] = useState<OtherActivity | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');

  useEffect(() => {
    const exercises = getExercisesByActivityType(ActivityType.OTHER) as any[];
    setData(exercises.map((ex, index) => ({
      id: ex.id || `other-${index}`,
      name: ex.name,
      description: ex.description,
      activityType: ActivityType.OTHER,
      category: ex.category || 'general',
      isDefault: ex.isDefault ?? true,
      customCategory: ex.category || 'general',
      customFields: [],
      metrics: Object.keys(ex.metrics || {}).reduce((acc: any, k) => { acc[k] = true; return acc; }, {})
    })) as OtherActivity[]);
  }, []);

  function handleSelect(ex: OtherActivity) {
    setSelected(ex);
    setView('logging');
  }

  if (view === 'logging' && selected) {
    return (
      <UniversalActivityLogger
        template={otherTemplate}
        activityName={selected.name}
        onClose={onClose}
        onBack={() => setView('list')}
        onActivityLogged={onActivityLogged}
        selectedDate={selectedDate}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="absolute top-4 left-4">
          <button
            onClick={onBack}
            className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 text-sm"
          >
            ← Back
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <UniversalExercisePicker
          data={data as any[]}
          enrich={enrich as any}
          collectFacets={collectFacets as any}
          applyFilters={applyFilters as any}
          onSelect={handleSelect}
          title="Other Activities"
          subtitle="Browse and filter miscellaneous activities"
        />
      </div>
    </div>
  );
};

export default OtherActivityPicker;
