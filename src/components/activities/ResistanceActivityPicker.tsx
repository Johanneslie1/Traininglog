import React, { useState } from 'react';
import { ResistanceExercise } from '@/types/activityTypes';
import resistanceData from '@/data/exercises/resistance.json';
import { enrich, applyFilters, collectFacets } from '@/utils/resistanceFilters';
import UniversalExercisePicker from './UniversalExercisePicker';
import UniversalActivityLogger from './UniversalActivityLogger';
import { strengthTemplate } from '@/config/defaultTemplates';

interface ResistanceActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
}

const ResistanceActivityPicker: React.FC<ResistanceActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date()
}) => {
  const [selectedExercise, setSelectedExercise] = useState<ResistanceExercise | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');

  function handleSelect(ex: ResistanceExercise) {
    setSelectedExercise(ex);
    setView('logging');
  }

  if (view === 'logging' && selectedExercise) {
    return (
      <UniversalActivityLogger
  template={strengthTemplate}
        activityName={selectedExercise.name}
        onClose={onClose}
        onBack={() => setView('list')}
        onActivityLogged={onActivityLogged}
        selectedDate={selectedDate}
        editingExercise={null}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="absolute top-4 left-4 flex gap-2">
          <button onClick={onBack} className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 text-sm">← Back</button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <UniversalExercisePicker
          data={resistanceData as ResistanceExercise[]}
          enrich={enrich as any}
          collectFacets={collectFacets as any}
          applyFilters={applyFilters as any}
          onSelect={handleSelect}
          title="Resistance Training"
          subtitle="Browse and filter all resistance exercises"
        />
      </div>
    </div>
  );
};

export default ResistanceActivityPicker;
