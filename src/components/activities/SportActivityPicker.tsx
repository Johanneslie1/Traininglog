import React, { useState, useEffect } from 'react';
import { ActivityType, SportActivity } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import UniversalExercisePicker from './UniversalExercisePicker';
import { enrich, collectFacets, applyFilters } from '@/utils/sportFilters';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';

interface SportActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
}

const SportActivityPicker: React.FC<SportActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  const [data, setData] = useState<SportActivity[]>([]);
  const [selected, setSelected] = useState<SportActivity | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const exercises = getExercisesByActivityType(ActivityType.SPORT) as any[];
    setData(exercises.map((ex, index) => {
      const m = ex.metrics || {};
      return {
        id: ex.id || `sport-${index}`,
        name: ex.name,
        description: ex.description,
        activityType: ActivityType.SPORT,
        category: ex.category || 'general',
        isDefault: ex.isDefault ?? true,
        sportType: ex.sportType || 'general',
        skillLevel: 'intermediate',
        teamBased: !!ex.teamBased,
        equipment: ex.equipment || [],
        primarySkills: ex.skills || [],
        metrics: {
          trackDuration: !!m.trackDuration || !!m.trackTime,
          trackScore: !!m.trackScore,
            trackIntensity: !!m.trackIntensity || !!m.trackRPE,
            trackPerformance: !!m.trackPerformance
        }
      } as SportActivity;
    }));

    if (editingExercise) {
      const mockSport: SportActivity = {
        id: editingExercise.id || 'editing-sport',
        name: editingExercise.exerciseName,
        category: 'general',
        description: '',
        isDefault: false,
        activityType: ActivityType.SPORT,
        sportType: 'general',
        skillLevel: 'intermediate',
        teamBased: false,
        equipment: [],
        primarySkills: [],
        metrics: { trackDuration: true, trackScore: false, trackIntensity: true, trackPerformance: false }
      };
      setSelected(mockSport);
      setView('logging');
    }
  }, [editingExercise]);

  function handleSelect(ex: SportActivity) { setSelected(ex); setView('logging'); }

  if (view === 'logging' && selected) {
    // Convert SportActivity to Exercise format for UniversalSetLogger
    const exercise: Exercise = {
      id: selected.id,
      name: selected.name,
      description: selected.description || '',
      activityType: ActivityType.SPORT,
      type: 'teamSports',
      category: selected.category || 'sport',
      equipment: selected.equipment || [],
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
            console.log('💾 SportActivityPicker: Starting to save exercise sets:', {
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

            console.log('💾 SportActivityPicker: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            console.log('✅ SportActivityPicker: Exercise saved successfully with ID:', docId);

            onActivityLogged();
            setView('list');
          } catch (error) {
            console.error('❌ SportActivityPicker: Error saving exercise:', error);
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
          title="Sports Activities"
          subtitle="Browse and filter sports and skill drills"
        />
      </div>
    </div>
  );
};

export default SportActivityPicker;
