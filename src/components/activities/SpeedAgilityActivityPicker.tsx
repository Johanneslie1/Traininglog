import React, { useState, useEffect, useMemo } from 'react';
import { ActivityType, SpeedAgilityActivity } from '@/types/activityTypes';
import rawData from '@/data/exercises/speedAgility.json';
import { enrich, applyFilters, collectFacets, FilterState, SpeedAgilityExercise } from '@/utils/speedAgilityFilters';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import toast from 'react-hot-toast';
import { SessionType } from '@/types/sessionType';

interface SpeedAgilityActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null;
  isWarmupMode?: boolean;
  selectedSessionId?: string | null;
  selectedSessionType?: SessionType;
}

const SpeedAgilityActivityPicker: React.FC<SpeedAgilityActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null,
  isWarmupMode = false,
  selectedSessionId,
  selectedSessionType = 'main'
}) => {
  const [selectedActivity, setSelectedActivity] = useState<SpeedAgilityActivity | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');
  const [customDrills, setCustomDrills] = useState<SpeedAgilityExercise[]>([]);
  // Advanced filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [lateralFilter, setLateralFilter] = useState<Set<string>>(new Set());
  const [equipmentFilter, setEquipmentFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { user } = useAuth();

  const sourceData = useMemo(() => {
    const jsonDrills = rawData as SpeedAgilityExercise[];
    return [...jsonDrills, ...customDrills];
  }, [customDrills]);

  const enriched = useMemo(() => enrich(sourceData), [sourceData]);
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
        metrics: { trackTime: false, trackDistance: true, trackReps: true, trackRPE: true, trackHeight: true }
      };
      setSelectedActivity(mock);
      setView('logging');
    }
  }, [editingExercise]);

  useEffect(() => {
    const loadCustomDrills = async () => {
      if (!user?.id) {
        setCustomDrills([]);
        return;
      }

      try {
        const customQuery = query(collection(db, 'exercises'), where('userId', '==', user.id));
        const querySnapshot = await getDocs(customQuery);

        const drills = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(ex => ex.activityType === ActivityType.SPEED_AGILITY)
          .map(ex => ({
            id: ex.id,
            name: ex.name || 'Custom Drill',
            category: ex.category || 'general',
            type: ex.drillType || ex.type || 'agility',
            lateralization: ex.lateralization || 'bilateral',
            equipment: Array.isArray(ex.equipment) ? (ex.equipment[0] || 'bodyweight') : (ex.equipment || 'bodyweight'),
            muscleGroups: Array.isArray(ex.targetAreas)
              ? ex.targetAreas
              : (Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : ['full body']),
            instructions: Array.isArray(ex.instructions)
              ? (ex.instructions[0] || ex.description || '')
              : (ex.instructions || ex.description || '')
          })) as SpeedAgilityExercise[];

        setCustomDrills(drills);
      } catch (error) {
        console.error('Error loading custom speed/agility drills:', error);
        setCustomDrills([]);
      }
    };

    loadCustomDrills();
  }, [user?.id]);

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
      metrics: { trackTime: false, trackDistance: true, trackReps: true, trackRPE: true, trackHeight: true }
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
      difficulty: selectedActivity.difficulty,
      defaultUnit: 'time',
      metrics: {
        trackTime: false,
        trackReps: true,
        trackSets: true,
        trackDistance: true,
        trackRPE: true,
        trackHeight: true
      },
      prescription: editingExercise?.prescription,
      instructionMode: editingExercise?.instructionMode,
      instructions: editingExercise?.instructions
        ? [editingExercise.instructions]
        : Array.isArray(selectedActivity.instructions)
          ? selectedActivity.instructions
          : [selectedActivity.instructions || '']
    };

    return (
      <UniversalSetLogger
        exercise={exercise}
        onCancel={() => setView('list')}        onSave={async (sets: ExerciseSet[]) => {
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
              activityType: ActivityType.SPEED_AGILITY,
              isWarmup: isWarmupMode,
              sessionId: editingExercise?.sessionId || selectedSessionId || undefined,
              sessionType: editingExercise?.sessionType || selectedSessionType,
              prescription: exercise.prescription,
              instructionMode: exercise.instructionMode,
              instructions: Array.isArray(exercise.instructions)
                ? exercise.instructions[0]
                : undefined
            };

            console.log('💾 SpeedAgilityActivityPicker: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            console.log('✅ SpeedAgilityActivityPicker: Exercise saved successfully with ID:', docId);

            onActivityLogged();
            setView('list');
            toast.success(editingExercise ? 'Activity updated' : 'Activity saved');
          } catch (error) {
            console.error('❌ SpeedAgilityActivityPicker: Error saving exercise:', error);
            const message = error instanceof Error ? error.message : 'Failed to save activity';
            toast.error(message);
            throw error instanceof Error ? error : new Error(message);
          }
        }}
        initialSets={editingExercise?.sets || []}
        isEditing={!!editingExercise}
        prescription={exercise.prescription}
        instructionMode={exercise.instructionMode}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-bg-primary/90 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-secondary rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-text-primary">Speed, Agility & Plyometrics</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Advanced Filters */}
        {/* Search, Quick Filters & Advanced (Sticky) */}
        <div className="p-4 border-b border-border space-y-3 bg-bg-secondary/95 backdrop-blur sticky top-0 z-10">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search drills (name or instructions)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              aria-label="Search speed agility plyometric drills"
            />
            <button
              onClick={() => { setSearch(''); setTypeFilter(new Set()); setLateralFilter(new Set()); setEquipmentFilter(new Set()); setTagFilter(new Set()); }}
              className="px-3 py-2 text-xs font-medium bg-bg-tertiary border border-border rounded-md text-text-secondary hover:text-text-primary hover:border-accent-primary"
              aria-label="Reset filters"
            >Reset</button>
            <button
              onClick={() => setShowAdvanced(s => !s)}
              className="px-3 py-2 text-xs font-medium bg-bg-tertiary border border-border rounded-md text-text-secondary hover:text-text-primary hover:border-accent-primary"
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
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-accent-primary border-accent-primary text-text-on-accent' : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-primary hover:text-text-primary'}`}
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
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-accent-secondary border-accent-secondary text-text-on-accent' : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-secondary hover:text-text-primary'}`}
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
          <p className="text-[11px] text-text-tertiary">Showing <span className="text-accent-secondary font-semibold">{advancedFiltered.length}</span> of {enriched.length} drills</p>
        </div>

        {/* Activities List - Compact View */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="space-y-1">
            {advancedFiltered.map(ex => (
              <div
                key={ex.id}
                onClick={() => handleSelectEnriched(ex)}
                className="relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all border bg-bg-tertiary/50 border-transparent hover:bg-bg-tertiary hover:border-border"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectEnriched(ex);
                  }
                }}
              >
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate text-text-primary">
                      {ex.name}
                    </h3>
                    {/* Primary badge only */}
                    {(ex.category || (ex as any).drillType) && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-bg-secondary border border-border text-text-tertiary text-[10px] rounded uppercase tracking-wide">
                        {ex.category || (ex as any).drillType}
                      </span>
                    )}
                  </div>
                  {/* Optional: Show description */}
                  {(ex as any).description && (
                    <p className="text-text-tertiary text-xs mt-0.5 line-clamp-1">{(ex as any).description}</p>
                  )}
                </div>

                {/* Difficulty indicator */}
                {(ex as any).difficulty && (
                  <div className="flex-shrink-0">
                    <span className={`text-[10px] px-2 py-1 rounded ${
                      (ex as any).difficulty === 'beginner' ? 'bg-green-600/20 text-green-400' :
                      (ex as any).difficulty === 'intermediate' ? 'bg-yellow-600/20 text-yellow-400' :
                      (ex as any).difficulty === 'advanced' ? 'bg-red-600/20 text-red-400' :
                      'bg-bg-secondary text-text-tertiary'
                    }`}>
                      {(ex as any).difficulty}
                    </span>
                  </div>
                )}

                {/* Right arrow indicator */}
                <svg className="flex-shrink-0 w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          {advancedFiltered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-tertiary text-lg">No drills found</p>
              <p className="text-text-muted text-sm mt-2">Try adjusting your search or filter</p>
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
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1">
        {values.sort().map(v => {
          const active = selected.has(v);
          return (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className={`px-2 py-0.5 rounded border text-[10px] ${active ? 'bg-accent-primary border-accent-primary text-text-on-accent' : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-primary hover:text-text-primary'}`}
            >{v}</button>
          );
        })}
      </div>
    </div>
  );
};

export default SpeedAgilityActivityPicker;
