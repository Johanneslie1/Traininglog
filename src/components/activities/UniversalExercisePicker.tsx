import React, { useState, useMemo } from 'react';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';

// Move FilterBlock definition up so it's declared before use
interface FilterBlockProps { title: string; values: string[]; selected: Set<string>; onToggle: (value: string) => void; }
const FilterBlock: React.FC<FilterBlockProps> = ({ title, values, selected, onToggle }) => {
  if (!values.length) return null;
  
  // Deduplicate values to prevent duplicate React keys
  const uniqueValues = Array.from(new Set(values));
  
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1">
        {uniqueValues.sort().map((v: string, index: number) => {
          const active = selected.has(v);
            return (
              <button key={`${title}-${v}-${index}`} onClick={() => onToggle(v)} className={`px-2 py-0.5 rounded border text-[10px] ${active ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-white'}`}>{v}</button>
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

  const handleExerciseCreated = (_exerciseId: string) => {
    setShowCreateDialog(false);
    // Optionally refresh the exercise list or handle the new exercise
    // For now, we'll just close the dialog
  };

  const enriched = useMemo(() => {
    try {
      const input = Array.isArray(data) ? data : [];
      const result = typeof enrich === 'function' ? (enrich(input) ?? []) : input;
      return Array.isArray(result) ? result : [];
    } catch (e) {
      console.error('UniversalExercisePicker: enrich error', e);
      return [];
    }
  }, [data, enrich]);

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
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-gray-400">{subtitle}</p>}
        </div>
        {multiSelect && (
          <div className="text-xs text-gray-400">Selected: <span className="text-yellow-400 font-semibold">{selectedCount}</span></div>
        )}
      </div>
      {/* Search, Quick Filters & Advanced (Sticky) */}
      <div className="p-4 border-b border-gray-700 space-y-3 bg-[#1a1a1a]/95 backdrop-blur sticky top-0 z-10">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search exercises (name or instructions)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            aria-label="Search exercises"
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
          {Array.from(facets.type).map(q => {
            const value = String(q);
            const active = typeFilter.has(value);
            return (
              <button
                key={value}
                onClick={() => toggle(setTypeFilter, value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-white'}`}
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-blue-500 border-blue-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-400 hover:text-white'}`}
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
        <p className="text-[11px] text-gray-400">Showing <span className="text-yellow-400 font-semibold">{advancedFiltered.length}</span> of {enriched.length} exercises</p>
      </div>
      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {advancedFiltered.map(ex => {
            const active = multiSelect ? !!selectedMap[ex.id] : false;
            return (
              <div
                key={ex.id}
                onClick={() => handleCardClick(ex)}
                className={`relative bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors border ${active ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-600'}`}
              >
                {renderCard ? renderCard(ex, active) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-1">{ex.name}</h3>
                    {ex.description && (
                      <p className="text-gray-400 text-xs mb-2 line-clamp-3">{ex.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {ex.category && (
                        <span className="px-2 py-0.5 bg-yellow-600 text-white text-[10px] rounded">{ex.category}</span>
                      )}
                      {ex.type && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded">{ex.type}</span>
                      )}
                      {ex.difficulty && (
                        <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] rounded">{ex.difficulty}</span>
                      )}
                      {Array.isArray(ex.tags) && ex.tags.slice(0,3).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-gray-700 text-gray-200 text-[10px] rounded">{t}</span>
                      ))}
                    </div>
                    {active && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">✓</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {advancedFiltered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No exercises found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter</p>
            <div className="mt-6">
              <button
                onClick={handleCreateExercise}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
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
        <div className="border-t border-gray-700 p-4 bg-[#1a1a1a] flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs text-gray-400 max-w-[60%]">
            {selectedList.slice(0,6).map(s => <span key={s.id} className="px-2 py-0.5 bg-gray-800 rounded border border-gray-600 text-gray-300 truncate max-w-[120px]">{s.name}</span>)}
            {selectedList.length > 6 && <span className="text-gray-500">+{selectedList.length - 6} more</span>}
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setSelectedMap({})} disabled={selectedCount===0} className={`px-3 py-2 text-xs font-medium rounded-md border ${selectedCount===0 ? 'text-gray-500 border-gray-700 cursor-not-allowed' : 'text-gray-300 border-gray-600 hover:text-white hover:border-yellow-500'}`}>Clear</button>
            <button onClick={() => { if (onConfirmSelection) onConfirmSelection(selectedList); }} disabled={selectedCount===0} className={`px-4 py-2 text-sm font-semibold rounded-md ${selectedCount===0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}>{confirmLabel} {selectedCount>0 && `(${selectedCount})`}</button>
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
