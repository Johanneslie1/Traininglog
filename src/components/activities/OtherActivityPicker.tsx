import React, { useState, useEffect } from 'react';
import { ActivityType, OtherActivity } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import UniversalExercisePicker from './UniversalExercisePicker';
import { enrich, collectFacets, applyFilters } from '@/utils/otherFilters';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';

interface OtherActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  isWarmupMode?: boolean;
}

const OtherActivityPicker: React.FC<OtherActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  isWarmupMode = false
}) => {
  const [data, setData] = useState<OtherActivity[]>([]);
  const [selected, setSelected] = useState<OtherActivity | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');
  const user = useSelector((state: RootState) => state.auth.user);

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
    // Convert OtherActivity to Exercise format for UniversalSetLogger
    const exercise: Exercise = {
      id: selected.id,
      name: selected.name,
      description: selected.description || '',
      activityType: ActivityType.OTHER,
      type: 'other',
      category: selected.category || 'general',
      equipment: ['bodyweight'],
      instructions: [selected.description || ''],
      difficulty: 'beginner',
      defaultUnit: 'time',
      metrics: {
        trackTime: true,
        trackDuration: true,
        trackRPE: true
      }
    };

    return (
      <UniversalSetLogger
        exercise={exercise}
        onCancel={() => setView('list')}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            console.log('💾 OtherActivityPicker: Starting to save exercise sets:', {
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
              activityType: ActivityType.OTHER,
              isWarmup: isWarmupMode
            };

            console.log('💾 OtherActivityPicker: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            console.log('✅ OtherActivityPicker: Exercise saved successfully with ID:', docId);

            onActivityLogged();
            setView('list');
          } catch (error) {
            console.error('❌ OtherActivityPicker: Error saving exercise:', error);
          }
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
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
          activityType={ActivityType.OTHER}
        />
      </div>
    </div>
  );
};

export default OtherActivityPicker;
