import React, { useState, useEffect, useMemo } from 'react';
import { ActivityType, SpeedAgilityActivity } from '@/types/activityTypes';
import { speedAgilityTemplate } from '@/config/defaultTemplates';
import rawData from '@/data/exercises/speedAgility.json';
import { enrich, applyFilters, collectFacets, FilterState, SpeedAgilityExercise } from '@/utils/speedAgilityFilters';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';

interface SpeedAgilityActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null;
}

const SpeedAgilityActivityPicker: React.FC<SpeedAgilityActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  const [selectedActivity, setSelectedActivity] = useState<SpeedAgilityActivity | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');
  // Advanced filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [lateralFilter, setLateralFilter] = useState<Set<string>>(new Set());
  const [equipmentFilter, setEquipmentFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const enriched = useMemo(() => enrich(rawData as SpeedAgilityExercise[]), []);
  const facets = useMemo(() => collectFacets(enriched), [enriched]);
  const advancedFiltered = useMemo(() => {
    const f: FilterState = {
      search,
      type: typeFilter,
      lateralization: lateralFilter,
      equipment: equipmentFilter,
      includeTags: tagFilter
    };
    return applyFilters(enriched, f);
  }, [search, typeFilter, lateralFilter, equipmentFilter, tagFilter, enriched]);

  const user = useSelector((state: RootState) => state.auth.user);

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  useEffect(() => {
    if (editingExercise) {
      const mock: SpeedAgilityActivity = {
        id: editingExercise.id || 'editing-speedAgility',
        name: editingExercise.exerciseName,
        category: 'general',
        description: '',
        isDefault: false,
        activityType: ActivityType.SPEED_AGILITY,
        drillType: 'agility',
        equipment: [],
        difficulty: 'beginner',
        setup: [],
        instructions: [],
        metrics: { trackTime: true, trackDistance: true, trackReps: true, trackRPE: true }
      };
      setSelectedActivity(mock);
      setView('logging');
    }
  }, [editingExercise]);

  function handleSelectEnriched(ex: SpeedAgilityExercise) {
    const activity: SpeedAgilityActivity = {
      id: ex.id,
      name: ex.name,
      category: ex.category || 'general',
  description: (ex as any).description || '',
      isDefault: true,
      activityType: ActivityType.SPEED_AGILITY,
      drillType: (ex as any).drillType || ex.type || 'agility',
  equipment: Array.isArray((ex as any).equipment) ? (ex as any).equipment : ((ex as any).equipment ? [(ex as any).equipment] : []),
  difficulty: (ex as any).difficulty || 'beginner',
  setup: Array.isArray((ex as any).setup) ? (ex as any).setup : [],
  instructions: Array.isArray((ex as any).instructions) ? (ex as any).instructions : ((ex as any).instructions ? [(ex as any).instructions] : []),
      metrics: { trackTime: true, trackDistance: true, trackReps: true, trackRPE: true }
    };
    setSelectedActivity(activity);
    setView('logging');
  }

  if (view === 'logging' && selectedActivity) {
    // Convert SpeedAgilityActivity to Exercise format for UniversalSetLogger
    const exercise: Exercise = {
      id: selectedActivity.id,
      name: selectedActivity.name,
      description: selectedActivity.description || '',
      activityType: ActivityType.SPEED_AGILITY,
      type: 'speedAgility',
      category: selectedActivity.category,
      equipment: selectedActivity.equipment,
      instructions: Array.isArray(selectedActivity.instructions) 
        ? selectedActivity.instructions 
        : [selectedActivity.instructions || ''],
      difficulty: selectedActivity.difficulty,
      defaultUnit: 'time',
      metrics: {
        trackTime: true,
        trackReps: true,
        trackSets: true,
        trackDistance: true,
        trackRPE: true,
        trackHeight: true
      }
    };

    return (
      <UniversalSetLogger
        exercise={exercise}
        onCancel={() => setView('list')}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            console.log('💾 SpeedAgilityActivityPicker: Starting to save exercise sets:', {
              exercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            const exerciseLogData = {
              exerciseName: selectedActivity.name,
              userId: user.id,
              sets: sets,
            };

            console.log('💾 SpeedAgilityActivityPicker: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            console.log('✅ SpeedAgilityActivityPicker: Exercise saved successfully with ID:', docId);

            onActivityLogged();
            setView('list');
          } catch (error) {
            console.error('❌ SpeedAgilityActivityPicker: Error saving exercise:', error);
          }
        }}
        initialSets={editingExercise?.sets || []}
        isEditing={!!editingExercise}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white">Speed, Agility & Plyometrics</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Advanced Filters */}
        {/* Search, Quick Filters & Advanced (Sticky) */}
        <div className="p-4 border-b border-gray-700 space-y-3 bg-[#1a1a1a]/95 backdrop-blur sticky top-0 z-10">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search drills (name or instructions)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              aria-label="Search speed agility plyometric drills"
            />
            <button
              onClick={() => { setSearch(''); setTypeFilter(new Set()); setLateralFilter(new Set()); setEquipmentFilter(new Set()); setTagFilter(new Set()); }}
              className="px-3 py-2 text-xs font-medium bg-gray-800 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-yellow-500"
              aria-label="Reset filters"
            >Reset</button>
            <button
              onClick={() => setShowAdvanced(s => !s)}
              className="px-3 py-2 text-xs font-medium bg-gray-800 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-yellow-500"
              aria-expanded={showAdvanced}
              aria-controls="advanced-filters"
            >{showAdvanced ? 'Hide' : 'Filters'}</button>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {['sprint','agility','plyometric','jump','reaction','acceleration','ladder','hurdle'].map(q => {
              const active = typeFilter.has(q) || tagFilter.has(q);
              const handler = () => {
                if (['sprint','agility','plyometric'].includes(q)) {
                  toggle(setTypeFilter, q);
                } else {
                  toggle(setTagFilter, q);
                }
              };
              return (
                <button
                  key={q}
                  onClick={handler}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-white'}`}
                >{q}</button>
              );
            })}
            {/* Lateral quick toggles */}
            {['unilateral','bilateral'].map(lat => {
              const active = lateralFilter.has(lat);
              return (
                <button
                  key={lat}
                  onClick={() => toggle(setLateralFilter, lat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-blue-500 border-blue-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-400 hover:text-white'}`}
                >{lat}</button>
              );
            })}
          </div>

          {showAdvanced && (
            <div id="advanced-filters" className="space-y-3">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
                <FilterBlock title="Type" values={Array.from(facets.type)} selected={typeFilter} onToggle={v=>toggle(setTypeFilter,v)} />
                <FilterBlock title="Lateral" values={Array.from(facets.lateralization)} selected={lateralFilter} onToggle={v=>toggle(setLateralFilter,v)} />
                <FilterBlock title="Equipment" values={Array.from(facets.equipment)} selected={equipmentFilter} onToggle={v=>toggle(setEquipmentFilter,v)} />
                <FilterBlock title="Tags" values={Array.from(facets.tags).filter(t=>['jump','sprint','skip','bound','shuffle','resisted','assisted','reaction','explosive','ladder','hurdle','acceleration','depth','pogo','tuck'].includes(t))} selected={tagFilter} onToggle={v=>toggle(setTagFilter,v)} />
              </div>
            </div>
          )}
          <p className="text-[11px] text-gray-400">Showing <span className="text-yellow-400 font-semibold">{advancedFiltered.length}</span> of {enriched.length} drills</p>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {advancedFiltered.map(ex => (
              <div
                key={ex.id}
                onClick={() => handleSelectEnriched(ex)}
                className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600"
              >
                <h3 className="text-lg font-semibold text-white mb-1">{ex.name}</h3>
                {(ex as any).description && (
                  <p className="text-gray-400 text-xs mb-2 line-clamp-3">{(ex as any).description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {ex.category && (
                    <span className="px-2 py-0.5 bg-yellow-600 text-white text-[10px] rounded">{ex.category}</span>
                  )}
                  {(ex as any).drillType && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded">{(ex as any).drillType}</span>
                  )}
                  {(ex as any).difficulty && (
                    <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] rounded">{(ex as any).difficulty}</span>
                  )}
                  {Array.from(((ex as any).tags || []) as string[]).slice(0,3).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-700 text-gray-200 text-[10px] rounded">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {advancedFiltered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No drills found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Small internal filter block component
interface FilterBlockProps {
  title: string;
  values: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

const FilterBlock: React.FC<FilterBlockProps> = ({ title, values, selected, onToggle }) => {
  if (!values.length) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1">
        {values.sort().map(v => {
          const active = selected.has(v);
          return (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className={`px-2 py-0.5 rounded border text-[10px] ${active ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-white'}`}
            >{v}</button>
          );
        })}
      </div>
    </div>
  );
};

export default SpeedAgilityActivityPicker;
