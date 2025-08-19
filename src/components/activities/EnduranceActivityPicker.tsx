import React, { useState } from 'react';
import enduranceData from '@/data/exercises/endurance.json';
import { enrich, collectFacets, applyFilters } from '@/utils/enduranceFilters';
import UniversalExercisePicker from './UniversalExercisePicker';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { EnduranceExercise } from '@/types/activityTypes';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';

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
  const user = useSelector((state: RootState) => state.auth.user);

  function handleSelect(ex: EnduranceExercise) {
    setSelected(ex);
    setView('logging');
  }

  if (view === 'logging' && selected) {
    // Convert EnduranceExercise to Exercise format for UniversalSetLogger
    const exercise: Exercise = {
      id: selected.id,
      name: selected.name,
      description: selected.description || '',
      activityType: ActivityType.ENDURANCE,
      type: 'endurance',
      category: selected.category || 'cardio',
      equipment: Array.isArray(selected.equipment) ? selected.equipment : [selected.equipment || 'bodyweight'],
      instructions: [selected.description || ''],
      difficulty: 'beginner',
      defaultUnit: 'time',
      metrics: {
        trackTime: true,
        trackDistance: true,
        trackRPE: true,
        trackDuration: true
      }
    };

    return (
      <UniversalSetLogger
        exercise={exercise}
        onCancel={() => setView('list')}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            console.log('💾 EnduranceActivityPicker: Starting to save exercise sets:', {
              exercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            const exerciseLogData = {
              exerciseName: selected.name,
              userId: user.id,
              sets: sets,
            };

            console.log('💾 EnduranceActivityPicker: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            console.log('✅ EnduranceActivityPicker: Exercise saved successfully with ID:', docId);

            onActivityLogged();
            setView('list');
          } catch (error) {
            console.error('❌ EnduranceActivityPicker: Error saving exercise:', error);
          }
        }}
        initialSets={editingExercise?.sets || []}
        isEditing={!!editingExercise}
      />
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
