import React, { useMemo, useState } from 'react';
import data from '@/data/exercises/speedAgility.json';
import { enrich, applyFilters, collectFacets, FilterState, SpeedAgilityExercise } from '@/utils/speedAgilityFilters';

// PROMPT BOOSTER: UI for exploring Speed, Agility & Plyometrics exercises with multi-facet filters.

const allExercises: SpeedAgilityExercise[] = enrich(data as SpeedAgilityExercise[]);

function ToggleChips({
  values,
  selected,
  onToggle,
  label,
  limit,
}: { values: string[]; selected: Set<string>; onToggle: (v: string) => void; label: string; limit?: number }) {
  const shown = limit ? values.slice(0, limit) : values;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {shown.sort().map(v => (
          <button
            key={v}
            onClick={() => onToggle(v)}
            className={`px-2 py-1 rounded-full text-[10px] border transition-colors ${
              selected.has(v)
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-bg-secondary text-text-secondary border-border hover:border-accent-primary/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

const SpeedAgilityPlyoBrowser: React.FC = () => {
  const facets = useMemo(() => collectFacets(allExercises), []);
  const [search, setSearch] = useState('');
  const [includeTags, setIncludeTags] = useState(new Set<string>());
  const [type, setType] = useState(new Set<string>());
  const [lateralization, setLateralization] = useState(new Set<string>());
  const [equipment, setEquipment] = useState(new Set<string>());

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const f: FilterState = { search, includeTags, type, lateralization, equipment };
    return applyFilters(allExercises, f);
  }, [search, includeTags, type, lateralization, equipment]);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-text-primary">Speed, Agility & Plyometrics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-4 bg-bg-secondary rounded-lg p-4 border border-border h-fit sticky top-4">
          <input
            placeholder="Search name/instructions"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          />
          <ToggleChips
            label="Type"
            values={Array.from(facets.type)}
            selected={type}
            onToggle={v => toggle(setType, v)}
          />
          <ToggleChips
            label="Lateralization"
            values={Array.from(facets.lateralization)}
            selected={lateralization}
            onToggle={v => toggle(setLateralization, v)}
          />
          <ToggleChips
            label="Equipment"
            values={Array.from(facets.equipment)}
            selected={equipment}
            onToggle={v => toggle(setEquipment, v)}
          />
          <ToggleChips
            label="Tags"
            values={Array.from(facets.tags).filter(t => ['jump','skip','bound','shuffle','resisted','assisted','reaction','explosive','unilateral-jump','bilateral-jump','ladder','hurdle','cone','box','sled','parachute','acceleration','depth','tuck','pogo'].includes(t))}
            selected={includeTags}
            onToggle={v => toggle(setIncludeTags, v)}
          />
          <button
            onClick={() => {
              setSearch('');
              setIncludeTags(new Set());
              setType(new Set());
              setLateralization(new Set());
              setEquipment(new Set());
            }}
            className="w-full mt-2 text-xs bg-bg-primary border border-border hover:border-accent-primary text-text-secondary hover:text-text-primary rounded py-2"
          >
            Clear Filters
          </button>
          <p className="text-[11px] text-text-secondary mt-2">
            Showing {filtered.length} of {allExercises.length} exercises.
          </p>
        </div>

        {/* List */}
        <div className="lg:col-span-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <div key={ex.id} className="p-4 rounded-lg bg-bg-secondary border border-border hover:border-accent-primary transition-colors group">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-text-primary pr-2 leading-snug">{ex.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary capitalize">{ex.type}</span>
              </div>
              <div className="text-[10px] text-text-secondary mb-2 flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border/60">{ex.lateralization}</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border/60">{ex.equipment}</span>
              </div>
              <p className="text-[11px] text-text-secondary line-clamp-3 mb-2 min-h-[2.5rem]">{ex.instructions}</p>
              <div className="flex flex-wrap gap-1">
                {ex.tags?.slice(0, 10).map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-bg-primary/60 border border-border/60 group-hover:border-accent-primary/50 text-text-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeedAgilityPlyoBrowser;
