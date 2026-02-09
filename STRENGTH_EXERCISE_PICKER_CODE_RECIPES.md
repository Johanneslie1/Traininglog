# Strength Exercise Picker - Code Examples & Recipes

## Table of Contents
1. [Basic Implementation](#basic-implementation)
2. [Customization Recipes](#customization-recipes)
3. [Integration Patterns](#integration-patterns)
4. [Advanced Examples](#advanced-examples)

---

## Basic Implementation

### Standard Usage (Already Implemented)

The default implementation in `SessionExerciseLogOptions.tsx` loads exercises and handles selection:

```typescript
import { StrengthExercisePicker } from '@/components/StrengthExercisePicker';

export const SessionExerciseLogOptions: React.FC<Props> = ({ onClose, onSave }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadExercises = async () => {
      setIsLoading(true);
      try {
        // Load exercises (default, imported, custom)
        const allExercises = [
          ...defaultExercises,
          ...importedExercises,
          ...customExercises
        ];
        setExercises(allExercises);
      } finally {
        setIsLoading(false);
      }
    };
    loadExercises();
  }, []);

  const handleSelectExercise = (exercise: Exercise) => {
    const exerciseWithSets: ExerciseWithSets = {
      ...exercise,
      id: exercise.id || crypto.randomUUID(),
      sets: []
    };
    onSave(exerciseWithSets);
  };

  return (
    <StrengthExercisePicker
      exercises={exercises}
      onSelect={handleSelectExercise}
      onClose={onClose}
      isLoading={isLoading}
      onCreateExercise={() => setShowCreateDialog(true)}
    />
  );
};
```

---

## Customization Recipes

### Recipe 1: Change Muscle Group Colors to Your Brand

**Goal**: Use custom brand colors instead of default colors

**File**: `src/components/StrengthExercisePicker.tsx`

```typescript
// BEFORE (Default colors)
const getMuscleGroupColor = (muscle: string): string => {
  const colorMap: Record<string, string> = {
    'chest': '#ef4444',
    'back': '#f97316',
    'shoulders': '#eab308',
    'biceps': '#06b6d4',
    'triceps': '#06b6d4',
    'legs': '#10b981',
    'forearms': '#8b5cf6',
    'core': '#ec4899',
    'traps': '#f97316',
    'lats': '#f97316',
    'lower_back': '#f97316',
    'full_body': '#6366f1',
  };
  return colorMap[muscle.toLowerCase()] || '#6b7280';
};

// AFTER (Brand colors - if your brand is purple/gold)
const getMuscleGroupColor = (muscle: string): string => {
  const colorMap: Record<string, string> = {
    'chest': '#c026d3',        // Purple
    'back': '#a855f7',         // Purple-light
    'shoulders': '#fbbf24',    // Gold
    'biceps': '#8b5cf6',       // Purple-lighter
    'triceps': '#8b5cf6',
    'legs': '#ec4899',         // Pink
    'forearms': '#60a5fa',     // Blue
    'core': '#f59e0b',         // Amber
    'traps': '#a855f7',
    'lats': '#a855f7',
    'lower_back': '#a855f7',
    'full_body': '#fbbf24',
  };
  return colorMap[muscle.toLowerCase()] || '#9ca3af';
};
```

### Recipe 2: Add Search Debounce for Large Lists

**Goal**: Add delay to search to reduce re-renders on large exercise lists

**File**: `src/components/StrengthExercisePicker.tsx`

```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';

export const StrengthExercisePicker: React.FC<StrengthExercisePickerProps> = ({
  exercises,
  onSelect,
  onClose,
  isLoading = false,
  onCreateExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Add debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use debouncedTerm instead of searchTerm for filtering
  const filteredExercises = useMemo(() => {
    if (!debouncedTerm.trim()) return exercises;

    const term = debouncedTerm.toLowerCase();
    return exercises.filter(exercise => {
      const matchesName = exercise.name.toLowerCase().includes(term);
      const matchesMuscles = (exercise.primaryMuscles || []).some(m =>
        m.toLowerCase().includes(term)
      );
      return matchesName || matchesMuscles;
    });
  }, [debouncedTerm, exercises]); // Note: depends on debouncedTerm now

  // ... rest of component
};
```

### Recipe 3: Add Category Filter Tabs

**Goal**: Add muscle group filter tabs above the search bar

**File**: `src/components/StrengthExercisePicker.tsx`

```typescript
interface StrengthExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  isLoading?: boolean;
  onCreateExercise?: () => void;
  // Optional: pre-selected filter
  defaultCategory?: string;
}

export const StrengthExercisePicker: React.FC<StrengthExercisePickerProps> = ({
  exercises,
  onSelect,
  onClose,
  isLoading = false,
  onCreateExercise,
  defaultCategory = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(defaultCategory);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const CATEGORIES = [
    { id: 'chest', label: 'Chest', color: '#ef4444' },
    { id: 'back', label: 'Back', color: '#f97316' },
    { id: 'shoulders', label: 'Shoulders', color: '#eab308' },
    { id: 'legs', label: 'Legs', color: '#10b981' },
    { id: 'arms', label: 'Arms', color: '#06b6d4' },
    { id: 'core', label: 'Core', color: '#ec4899' },
  ];

  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(exercise => {
        const matchesName = exercise.name.toLowerCase().includes(term);
        const matchesMuscles = (exercise.primaryMuscles || []).some(m =>
          m.toLowerCase().includes(term)
        );
        return matchesName || matchesMuscles;
      });
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(exercise => {
        const muscles = exercise.primaryMuscles || [];
        switch (selectedCategory) {
          case 'chest':
            return muscles.includes('chest');
          case 'back':
            return muscles.some(m => ['back', 'lats', 'traps'].includes(m));
          case 'shoulders':
            return muscles.includes('shoulders');
          case 'legs':
            return muscles.some(m => ['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(m));
          case 'arms':
            return muscles.some(m => ['biceps', 'triceps', 'forearms'].includes(m));
          case 'core':
            return muscles.includes('core');
          default:
            return true;
        }
      });
    }

    return result;
  }, [searchTerm, exercises, selectedCategory]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        {/* ... existing header code ... */}
      </header>

      {/* NEW: Category Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={!selectedCategory ? styles.filterTabActive : styles.filterTab}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={selectedCategory === cat.id ? styles.filterTabActive : styles.filterTab}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              borderBottomColor: selectedCategory === cat.id ? cat.color : 'transparent'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {/* ... existing search bar code ... */}

      {/* Exercise List */}
      {/* ... existing list code, now filtered by category ... */}
    </div>
  );
};
```

**Add CSS for filter tabs** (`StrengthExercisePicker.module.css`):

```css
.filterTabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  overflow-x: auto;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(15, 23, 42, 0.5);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* Smooth momentum scroll on iOS */
}

.filterTab {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}

.filterTab:hover {
  color: #cbd5e1;
}

.filterTabActive {
  composes: filterTab;
  color: #fff;
  border-bottom-color: #3b82f6;
}
```

### Recipe 4: Change Highlight Color (Selected State)

**Goal**: Change the blue highlight color to match your brand

**Files**: `src/components/StrengthExercisePicker.module.css`

```css
/* BEFORE (Blue highlight) */
.exerciseRowActive {
  background-color: rgba(59, 130, 246, 0.15);  /* Blue with 15% opacity */
  border-color: rgba(59, 130, 246, 0.3);       /* Blue with 30% opacity */
}

.chevron {
  color: #3b82f6;  /* Blue */
}

.searchInput:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);  /* Blue glow */
}

/* AFTER (Purple highlight - for purple brand) */
.exerciseRowActive {
  background-color: rgba(168, 85, 247, 0.15);  /* Purple with 15% opacity */
  border-color: rgba(168, 85, 247, 0.3);       /* Purple with 30% opacity */
}

.chevron {
  color: #a855f7;  /* Purple */
}

.searchInput:focus {
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);  /* Purple glow */
}
```

### Recipe 5: Light Mode Theme

**Goal**: Switch from dark mode to light mode

**File**: `src/components/StrengthExercisePicker.module.css`

```css
/* BEFORE (Dark mode) */
.container {
  background-color: #0f172a;
  color: #fff;
}

.searchInput {
  background-color: #1e293b;
  color: #fff;
}

.exerciseRow {
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

/* AFTER (Light mode) */
.container {
  background-color: #f8fafc;
  color: #1e293b;
}

.header {
  background: linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.title {
  color: #0f172a;
}

.searchInput {
  background-color: #fff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
}

.searchInput::placeholder {
  color: #94a3b8;
}

.exerciseName {
  color: #0f172a;
}

.exerciseCategory {
  color: #64748b;
}

.exerciseRow {
  border: 1px solid #e2e8f0;
  background-color: #fff;
}

.exerciseRow:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

/* Update all other color values similarly */
```

---

## Integration Patterns

### Pattern 1: Standalone Modal Usage

**Goal**: Use the picker in a standalone modal outside of SessionExerciseLogOptions

```typescript
// MyWorkoutPage.tsx
import { useState } from 'react';
import { StrengthExercisePicker } from '@/components/StrengthExercisePicker';
import { Exercise } from '@/types/exercise';

export const MyWorkoutPage: React.FC = () => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  return (
    <div>
      <h1>My Workout</h1>

      {selectedExercise && (
        <div>
          <h2>Selected: {selectedExercise.name}</h2>
          <p>Muscles: {selectedExercise.primaryMuscles?.join(', ')}</p>
        </div>
      )}

      <button onClick={() => setShowPicker(true)}>
        Select Exercise
      </button>

      {showPicker && (
        <StrengthExercisePicker
          exercises={allExercises}
          onSelect={(exercise) => {
            setSelectedExercise(exercise);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
```

### Pattern 2: Multi-Select (Superset Selection)

**Goal**: Allow selecting multiple exercises at once for supersets

```typescript
import { StrengthExercisePicker } from '@/components/StrengthExercisePicker';
import { Exercise } from '@/types/exercise';

interface MultiSelectPickerProps {
  exercises: Exercise[];
  onSelectMultiple: (exercises: Exercise[]) => void;
  onClose: () => void;
  maxSelections?: number;
}

export const MultiSelectStrengthExercisePicker: React.FC<MultiSelectPickerProps> = ({
  exercises,
  onSelectMultiple,
  onClose,
  maxSelections = 3,
}) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const handleSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(ex => ex.id === exercise.id);
      
      if (isSelected) {
        return prev.filter(ex => ex.id !== exercise.id);
      }
      
      if (prev.length >= maxSelections) {
        alert(`Maximum ${maxSelections} exercises allowed`);
        return prev;
      }
      
      return [...prev, exercise];
    });
  };

  const handleConfirm = () => {
    if (selectedExercises.length > 0) {
      onSelectMultiple(selectedExercises);
      onClose();
    }
  };

  return (
    <div>
      <StrengthExercisePicker
        exercises={exercises}
        onSelect={handleSelect}
        onClose={onClose}
      />
      
      {/* Selected list overlay */}
      {selectedExercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 p-4">
          <p>{selectedExercises.length} selected</p>
          <button onClick={handleConfirm}>Confirm Selection</button>
        </div>
      )}
    </div>
  );
};
```

### Pattern 3: With Recent Exercises

**Goal**: Show recently used exercises at the top of the list

```typescript
import { useMemo } from 'react';

export const StrengthExercisePickerWithRecent: React.FC<Props> = ({
  exercises,
  onSelect,
  onClose,
  recentExercises = [],
}) => {
  const sortedExercises = useMemo(() => {
    // Put recently used at the top
    const recent = exercises.filter(ex =>
      recentExercises.some(recent => recent.id === ex.id)
    );
    
    const others = exercises.filter(ex =>
      !recentExercises.some(recent => recent.id === ex.id)
    );
    
    return [...recent, ...others];
  }, [exercises, recentExercises]);

  return (
    <StrengthExercisePicker
      exercises={sortedExercises}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
};
```

---

## Advanced Examples

### Advanced 1: Server-Side Search for 1000+ Exercises

**Goal**: Offload search to backend for performance with large datasets

```typescript
import { useState, useEffect, useCallback } from 'react';

interface StrengthExercisePickerServerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export const StrengthExercisePickerServer: React.FC<StrengthExercisePickerServerProps> = ({
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search and fetch from server
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2 && searchTerm.length > 0) return; // Require 2+ chars

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/exercises/search?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await response.json();
        setExercises(data.exercises);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load default exercises on mount
  useEffect(() => {
    const loadDefaults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/exercises/popular');
        const data = await response.json();
        setExercises(data.exercises);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaults();
  }, []);

  return (
    <StrengthExercisePicker
      exercises={exercises}
      onSelect={onSelect}
      onClose={onClose}
      isLoading={isLoading}
    />
  );
};
```

### Advanced 2: Virtualized List for 10000+ Exercises

**Goal**: Use react-window for extreme performance with massive lists

```bash
npm install react-window
npm install --save-dev @types/react-window
```

```typescript
import { FixedSizeList } from 'react-window';
import { StrengthExercisePickerProps } from '@/components/StrengthExercisePicker';

interface VirtualizedPickerProps extends StrengthExercisePickerProps {
  listHeight?: number;
  itemSize?: number;
}

export const VirtualizedStrengthExercisePicker: React.FC<VirtualizedPickerProps> = ({
  exercises,
  onSelect,
  onClose,
  listHeight = 400,
  itemSize = 60,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return exercises;
    const term = searchTerm.toLowerCase();
    return exercises.filter(ex =>
      ex.name.toLowerCase().includes(term) ||
      (ex.primaryMuscles || []).some(m => m.toLowerCase().includes(term))
    );
  }, [exercises, searchTerm]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const exercise = filteredExercises[index];
    return (
      <button
        style={style}
        onClick={() => onSelect(exercise)}
        className="w-full text-left p-4 border-b"
      >
        <h3>{exercise.name}</h3>
        <p className="text-sm text-gray-600">
          {(exercise.primaryMuscles || []).join(', ')}
        </p>
      </button>
    );
  };

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      
      <FixedSizeList
        height={listHeight}
        itemCount={filteredExercises.length}
        itemSize={itemSize}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
};
```

### Advanced 3: Analytics Integration

**Goal**: Track usage analytics for the exercise picker

```typescript
import { useCallback } from 'react';

interface AnalyticsProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  onCreateExercise?: () => void;
}

export const StrengthExercisePickerWithAnalytics: React.FC<AnalyticsProps> = ({
  onSelect,
  onClose,
  onCreateExercise,
}) => {
  const [searchUsed, setSearchUsed] = useState(false);
  const startTime = useRef(Date.now());

  const trackEvent = (eventName: string, data: any) => {
    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    console.log(`📊 [${eventName}]`, data);
    
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
  };

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    const timeSpent = Date.now() - startTime.current;

    trackEvent('exercise_selected', {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      primary_muscle: exercise.primaryMuscles?.[0],
      search_used: searchUsed,
      time_to_select_ms: timeSpent,
      timestamp: new Date().toISOString(),
    });

    onSelect(exercise);
  }, [onSelect, searchUsed]);

  const handleClose = useCallback(() => {
    trackEvent('exercise_picker_closed', {
      time_spent_ms: Date.now() - startTime.current,
    });
    onClose();
  }, [onClose]);

  return (
    <StrengthExercisePicker
      exercises={exercises}
      onSelect={handleSelectExercise}
      onClose={handleClose}
      onCreateExercise={() => {
        trackEvent('create_exercise_initiated', {});
        onCreateExercise?.();
      }}
    />
  );
};
```

---

## Summary

These recipes and patterns provide:
- ✅ Quick customization solutions
- ✅ Integration patterns for different use cases
- ✅ Advanced performance optimizations
- ✅ Analytics tracking examples
- ✅ Multi-select implementations
- ✅ Server-side search handling

Copy and adapt as needed for your specific requirements!
