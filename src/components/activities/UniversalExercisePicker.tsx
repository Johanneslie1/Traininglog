import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

// Move FilterBlock definition up so it's declared before use
interface FilterBlockProps { title: string; values: string[]; selected: Set<string>; onToggle: (value: string) => void; }
const FilterBlock: React.FC<FilterBlockProps> = ({ title, values, selected, onToggle }) => {
  if (!values.length) return null;
  
  // Deduplicate values to prevent duplicate React keys
  const uniqueValues = Array.from(new Set(values));
  
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1">
        {uniqueValues.sort().map((v: string, index: number) => {
          const active = selected.has(v);
            return (
              <button key={`${title}-${v}-${index}`} onClick={() => onToggle(v)} className={`px-2 py-0.5 rounded border text-[10px] ${active ? 'bg-yellow-600 border-yellow-500 text-text-primary' : 'bg-bg-tertiary border-border text-text-secondary hover:border-yellow-500 hover:text-text-primary'}`}>{v}</button>
            );
        })}
      </div>
    </div>
  );
};

export interface UniversalExercisePickerProps {
  data: any[];
  enrich: (list: any[]) => any[];
  collectFacets: (list: any[]) => any;
  applyFilters: (list: any[], f: any) => any[];
  onSelect: (exercise: any) => void; // single select or toggle when multiSelect
  title: string;
  subtitle?: string;
  renderCard?: (exercise: any, active?: boolean) => React.ReactNode;
  activityType?: ActivityType; // Add activityType for create exercise dialog
  // New optional multi-select mode
  multiSelect?: boolean;
  onConfirmSelection?: (selected: any[]) => void;
  confirmLabel?: string;
  initialSelectedIds?: string[];
}

export const UniversalExercisePicker: React.FC<UniversalExercisePickerProps> = ({
  data,
  enrich,
  collectFacets,
  applyFilters,
  onSelect,
  title,
  subtitle,
  renderCard,
  activityType = ActivityType.OTHER,
  multiSelect = false,
  onConfirmSelection,
  confirmLabel = 'Add Selected',
  initialSelectedIds = []
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [lateralFilter, setLateralFilter] = useState<Set<string>>(new Set());
  const [equipmentFilter, setEquipmentFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(
    () => initialSelectedIds.reduce((acc, id) => { acc[id] = true; return acc; }, {} as Record<string, boolean>)
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const { user } = useAuth();

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  function handleCardClick(ex: any) {
    if (multiSelect) {
      setSelectedMap(prev => ({ ...prev, [ex.id]: !prev[ex.id] }));
      onSelect(ex); // still expose selection (toggle)
    } else {
      onSelect(ex);
    }
  }

  const handleCreateExercise = () => {
    setShowCreateDialog(true);
  };

  const loadCustomExercises = useCallback(async () => {
    if (!user?.id) {
      setCustomExercises([]);
      return;
    }

    try {
      const exercisesRef = collection(db, 'exercises');
      const customQuery = query(exercisesRef, where('userId', '==', user.id));
      const querySnapshot = await getDocs(customQuery);

      const typeFilteredExercises = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((exercise: any) => normalizeActivityType(exercise.activityType) === activityType);

      setCustomExercises(typeFilteredExercises);
    } catch (error) {
      console.error('UniversalExercisePicker: failed loading custom exercises', error);
      setCustomExercises([]);
    }
  }, [user?.id, activityType]);

  useEffect(() => {
    loadCustomExercises();
  }, [loadCustomExercises]);

  const handleExerciseCreated = async (_exerciseId: string) => {
    await loadCustomExercises();
    setShowCreateDialog(false);
  };

  const mergedData = useMemo(() => {
    const baseData = Array.isArray(data) ? data : [];
    const byId = new Map<string, any>();

    [...baseData, ...customExercises].forEach(exercise => {
      if (!exercise) return;
      const fallbackId = `${exercise.name || 'exercise'}-${exercise.activityType || activityType}`;
      const id = String(exercise.id || fallbackId);
      if (!byId.has(id)) {
        byId.set(id, { ...exercise, id });
      }
    });

    return Array.from(byId.values());
  }, [data, customExercises, activityType]);

  const enriched = useMemo(() => {
    try {
      const input = mergedData;
      const result = typeof enrich === 'function' ? (enrich(input) ?? []) : input;
      return Array.isArray(result) ? result : [];
    } catch (e) {
      console.error('UniversalExercisePicker: enrich error', e);
      return [];
    }
  }, [mergedData, enrich]);

  const facets = useMemo(() => {
    const empty = { type: new Set<string>(), lateralization: new Set<string>(), equipment: new Set<string>(), tags: new Set<string>() };
    try {
      const raw = typeof collectFacets === 'function' ? collectFacets(enriched) : null;
      if (!raw) return empty;
      const toSet = (v: any) => {
        if (v instanceof Set) return v;
        if (Array.isArray(v)) return new Set(v);
        if (typeof v === 'string') return new Set([v]);
        return new Set();
      };
      return {
        type: toSet(raw.type || raw.types),
        lateralization: toSet(raw.lateralization || raw.lateral || []),
        equipment: toSet(raw.equipment || []),
        tags: toSet(raw.tags || [])
      };
    } catch (e) {
      console.error('UniversalExercisePicker: collectFacets error', e);
      return empty;
    }
  }, [enriched, collectFacets]);

  const advancedFiltered = useMemo(() => {
    const f = { search, type: typeFilter, lateralization: lateralFilter, equipment: equipmentFilter, includeTags: tagFilter };
    try {
      if (typeof applyFilters === 'function') {
        return applyFilters(enriched, f) ?? [];
      }
      const searchLower = search.trim().toLowerCase();
      return enriched.filter(ex => {
        if (searchLower) {
          const hay = ((ex.name || '') + ' ' + (ex.description || '')).toLowerCase();
          if (!hay.includes(searchLower)) return false;
        }
        if (typeFilter.size > 0 && ex.type && !typeFilter.has(String(ex.type))) return false;
        if (lateralFilter.size > 0 && ex.lateralization && !lateralFilter.has(String(ex.lateralization))) return false;
        if (equipmentFilter.size > 0 && ex.equipment) {
          const eq = Array.isArray(ex.equipment) ? ex.equipment : [ex.equipment];
          if (!Array.from(equipmentFilter).every(v => eq.includes(v))) return false;
        }
        if (tagFilter.size > 0) {
          const tags = Array.isArray(ex.tags) ? ex.tags : [];
          if (!Array.from(tagFilter).every(t => tags.includes(t))) return false;
        }
        return true;
      });
    } catch (e) {
      console.error('UniversalExercisePicker: applyFilters error', e);
      return [];
    }
  }, [search, typeFilter, lateralFilter, equipmentFilter, tagFilter, enriched, applyFilters]);

  const selectedCount = multiSelect ? Object.values(selectedMap).filter(Boolean).length : 0;
  const selectedList = multiSelect ? enriched.filter(e => selectedMap[e.id]) : [];

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          {subtitle && <p className="text-text-tertiary">{subtitle}</p>}
        </div>
        {multiSelect && (
          <div className="text-xs text-text-tertiary">Selected: <span className="text-yellow-400 font-semibold">{selectedCount}</span></div>
        )}
      </div>
      {/* Search, Quick Filters & Advanced (Sticky) */}
      <div className="p-4 border-b border-border space-y-3 bg-bg-secondary/95 backdrop-blur sticky top-0 z-10">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search exercises (name or instructions)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-md text-text-primary placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            aria-label="Search exercises"
          />
          <button
            onClick={() => { setSearch(''); setTypeFilter(new Set()); setLateralFilter(new Set()); setEquipmentFilter(new Set()); setTagFilter(new Set()); }}
            className="px-3 py-2 text-xs font-medium bg-bg-tertiary border border-border rounded-md text-text-secondary hover:text-text-primary hover:border-yellow-500"
            aria-label="Reset filters"
          >Reset</button>
          <button
            onClick={() => setShowAdvanced(s => !s)}
            className="px-3 py-2 text-xs font-medium bg-bg-tertiary border border-border rounded-md text-text-secondary hover:text-text-primary hover:border-yellow-500"
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >{showAdvanced ? 'Hide' : 'Filters'}</button>
        </div>
        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {Array.from(facets.type).map(q => {
            const value = String(q);
            const active = typeFilter.has(value);
            return (
              <button
                key={value}
                onClick={() => toggle(setTypeFilter, value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-bg-tertiary border-border text-text-secondary hover:border-yellow-500 hover:text-text-primary'}`}
              >{value}</button>
            );
          })}
          {Array.from(facets.lateralization).map(lat => {
            const value = String(lat);
            const active = lateralFilter.has(value);
            return (
              <button
                key={value}
                onClick={() => toggle(setLateralFilter, value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-blue-500 border-blue-400 text-text-primary' : 'bg-bg-tertiary border-border text-text-secondary hover:border-blue-400 hover:text-text-primary'}`}
              >{value}</button>
            );
          })}
        </div>
        {showAdvanced && (
          <div id="advanced-filters" className="space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
              <FilterBlock title="Type" values={Array.from(facets.type)} selected={typeFilter} onToggle={v=>toggle(setTypeFilter,v)} />
              <FilterBlock title="Lateralization" values={Array.from(facets.lateralization)} selected={lateralFilter} onToggle={v=>toggle(setLateralFilter,v)} />
              <FilterBlock title="Equipment" values={Array.from(facets.equipment)} selected={equipmentFilter} onToggle={v=>toggle(setEquipmentFilter,v)} />
              <FilterBlock title="Tags" values={Array.from(facets.tags)} selected={tagFilter} onToggle={v=>toggle(setTagFilter,v)} />
            </div>
          </div>
        )}
        <p className="text-[11px] text-text-tertiary">Showing <span className="text-yellow-400 font-semibold">{advancedFiltered.length}</span> of {enriched.length} exercises</p>
      </div>
      {/* Exercise List - Compact View */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-1">
          {advancedFiltered.map(ex => {
            const active = multiSelect ? !!selectedMap[ex.id] : false;
            return (
              <div
                key={ex.id}
                onClick={() => handleCardClick(ex)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all border ${
                  active 
                    ? 'bg-yellow-500/10 border-yellow-500 shadow-sm' 
                    : 'bg-bg-tertiary/50 border-transparent hover:bg-bg-tertiary hover:border-border'
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(ex);
                  }
                }}
              >
                {renderCard ? renderCard(ex, active) : (
                  <>
                    {/* Selection indicator */}
                    {multiSelect && (
                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        active ? 'bg-yellow-500 border-yellow-500' : 'border-border bg-bg-secondary'
                      }`}>
                        {active && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                    
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${active ? 'text-yellow-400' : 'text-text-primary'}`}>
                          {ex.name}
                        </h3>
                        {/* Primary badge only */}
                        {(ex.category || ex.type) && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-bg-secondary border border-border text-text-tertiary text-[10px] rounded uppercase tracking-wide">
                            {ex.category || ex.type}
                          </span>
                        )}
                      </div>
                      {/* Optional: Show description on hover or in a tooltip */}
                      {ex.description && (
                        <p className="text-text-tertiary text-xs mt-0.5 line-clamp-1">{ex.description}</p>
                      )}
                    </div>

                    {/* Difficulty indicator */}
                    {ex.difficulty && (
                      <div className="flex-shrink-0">
                        <span className={`text-[10px] px-2 py-1 rounded ${
                          ex.difficulty === 'beginner' ? 'bg-green-600/20 text-green-400' :
                          ex.difficulty === 'intermediate' ? 'bg-yellow-600/20 text-yellow-400' :
                          ex.difficulty === 'advanced' ? 'bg-red-600/20 text-red-400' :
                          'bg-bg-secondary text-text-tertiary'
                        }`}>
                          {ex.difficulty}
                        </span>
                      </div>
                    )}

                    {/* Right arrow indicator for single select */}
                    {!multiSelect && (
                      <svg className="flex-shrink-0 w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {advancedFiltered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-tertiary text-lg">No exercises found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter</p>
            <div className="mt-6">
              <button
                onClick={handleCreateExercise}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent-primary text-text-primary font-medium hover:bg-accent-hover transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Create New Exercise
              </button>
            </div>
          </div>
        )}
      </div>
      {multiSelect && (
        <div className="border-t border-border p-4 bg-bg-secondary flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs text-text-tertiary max-w-[60%]">
            {selectedList.slice(0,6).map(s => <span key={s.id} className="px-2 py-0.5 bg-bg-tertiary rounded border border-border text-text-secondary truncate max-w-[120px]">{s.name}</span>)}
            {selectedList.length > 6 && <span className="text-gray-500">+{selectedList.length - 6} more</span>}
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setSelectedMap({})} disabled={selectedCount===0} className={`px-3 py-2 text-xs font-medium rounded-md border ${selectedCount===0 ? 'text-gray-500 border-border cursor-not-allowed' : 'text-text-secondary border-border hover:text-text-primary hover:border-yellow-500'}`}>Clear</button>
            <button onClick={() => { if (onConfirmSelection) onConfirmSelection(selectedList); }} disabled={selectedCount===0} className={`px-4 py-2 text-sm font-semibold rounded-md ${selectedCount===0 ? 'bg-bg-tertiary hover:opacity-90 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}>{confirmLabel} {selectedCount>0 && `(${selectedCount})`}</button>
          </div>
        </div>
      )}
      
      {/* Create Exercise Dialog */}
      {showCreateDialog && (
        <CreateUniversalExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleExerciseCreated}
          activityType={activityType}
          searchQuery={search}
        />
      )}
    </div>
  );
};

export default UniversalExercisePicker;
