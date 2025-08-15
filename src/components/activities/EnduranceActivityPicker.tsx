import React, { useState } from 'react';
import enduranceData from '@/data/exercises/endurance.json';
import { enrich, collectFacets, applyFilters } from '@/utils/enduranceFilters';
import UniversalExercisePicker from './UniversalExercisePicker';
import UniversalActivityLogger from './UniversalActivityLogger';
import { enduranceTemplate } from '@/config/defaultTemplates';
import { EnduranceExercise } from '@/types/activityTypes';

interface EnduranceActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: any | null;
}

const EnduranceActivityPicker: React.FC<EnduranceActivityPickerProps> = ({ onClose, onBack, onActivityLogged, selectedDate = new Date(), editingExercise = null }) => {
  const [selected, setSelected] = useState<EnduranceExercise | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');

  function handleSelect(ex: EnduranceExercise) {
    setSelected(ex);
    setView('logging');
  }

  if (view === 'logging' && selected) {
    return (
      <UniversalActivityLogger template={enduranceTemplate} activityName={selected.name} onClose={onClose} onBack={() => setView('list')} onActivityLogged={onActivityLogged} selectedDate={selectedDate} editingExercise={editingExercise} />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="absolute top-4 left-4">
          <button onClick={onBack} className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 text-sm">← Back</button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <UniversalExercisePicker data={enduranceData as unknown as EnduranceExercise[]} enrich={enrich as any} collectFacets={collectFacets as any} applyFilters={applyFilters as any} onSelect={handleSelect} title="Endurance Training" subtitle="Browse and filter endurance exercises" />
      </div>
    </div>
  );
};

export default EnduranceActivityPicker;
