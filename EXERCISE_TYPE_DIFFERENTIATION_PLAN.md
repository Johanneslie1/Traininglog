# Exercise Type Differentiation Implementation Plan

## Overview
Implementation plan to differentiate exercise logging by type, with specific stats and validation for each exercise type while maintaining a consistent UI layout.

## Exercise Types & Stats Configuration

### 1. Strength
- **Required**: Sets, reps, weight, RIR (Reps In Reserve)
- **Optional**: Rest time, notes
- **Categories**: Compound, Isolation, Olympic, Power

### 2. Plyometrics  
- **Required**: Sets, reps, RPE (Rate of Perceived Exertion)
- **Optional**: Height/distance, rest time, notes
- **Categories**: Jump, Throw, Reactive

### 3. Endurance
- **Required**: Duration, distance, RPE
- **Optional**: HR Zone 1, HR Zone 2, HR Zone 3, notes
- **Categories**: Running, Cycling, Swimming, Walking

### 4. Team Sports
- **Required**: Duration, distance, RPE  
- **Optional**: HR Zone 1, HR Zone 2, HR Zone 3, notes
- **Categories**: Football, Basketball, Soccer, etc.

### 5. Flexibility
- **Required**: Duration, stretch type, intensity
- **Optional**: Notes
- **Categories**: Static, Dynamic, PNF, Yoga

### 6. Other Activities
- **Required**: Duration, RPE
- **Optional**: Distance, HR Zone 1, HR Zone 2, HR Zone 3, notes
- **Categories**: Hiking, Individual Sports, General

## Implementation Steps

### Phase 1: Data Model Updates

#### 1.1 Update Exercise Types
```typescript
// src/types/exercise.ts
export type ExerciseType = 'strength' | 'plyometrics' | 'endurance' | 'teamSports' | 'flexibility' | 'other';

export interface Exercise {
  // ...existing fields
  type: ExerciseType;
  categories: string[]; // New field for multiple categories
  // ...rest of fields
}
```

#### 1.2 Create Exercise Stats Configuration
```typescript
// src/config/exerciseTypes.ts
export interface ExerciseTypeConfig {
  type: ExerciseType;
  requiredStats: string[];
  optionalStats: string[];
  displayName: string;
  description: string;
  categories: string[];
}

export const EXERCISE_TYPE_CONFIGS: Record<ExerciseType, ExerciseTypeConfig> = {
  strength: {
    type: 'strength',
    requiredStats: ['sets', 'reps', 'weight', 'rir'],
    optionalStats: ['restTime', 'notes'],
    displayName: 'Strength',
    description: 'Weight training and resistance exercises',
    categories: ['Compound', 'Isolation', 'Olympic', 'Power']
  },
  // ... other configs
};
```

#### 1.3 Update ExerciseSet Interface
```typescript
// src/types/sets.ts
export interface ExerciseSet {
  // Existing fields
  weight?: number;
  reps?: number;
  difficulty?: DifficultyCategory;
  
  // New fields for different exercise types
  rir?: number; // Reps in Reserve (Strength)
  rpe?: number; // Rate of Perceived Exertion (Most types except strength)
  duration?: number; // Duration in minutes
  distance?: number; // Distance in km
  hrZone1?: number; // Time in HR Zone 1 (minutes)
  hrZone2?: number; // Time in HR Zone 2 (minutes) 
  hrZone3?: number; // Time in HR Zone 3 (minutes)
  height?: number; // Height/distance for plyometrics
  stretchType?: string; // Type of stretch for flexibility
  intensity?: number; // Intensity level (1-10)
  restTime?: number; // Rest time in seconds
  notes?: string; // Additional notes
}
```

#### 1.4 Update ExerciseLog Interface
```typescript
// src/types/exercise.ts
export interface ExerciseLog {
  id: string;
  exerciseName: string;
  exerciseType: ExerciseType; // New field
  categories: string[]; // New field
  sets: ExerciseSet[];
  timestamp: Date;
  deviceId?: string;
  userId?: string;
}
```

### Phase 2: UI Components

#### 2.1 Create Dynamic Set Logger
```typescript
// src/components/DynamicExerciseSetLogger.tsx
interface DynamicExerciseSetLoggerProps {
  exercise: Exercise;
  exerciseType: ExerciseType;
  onSave: (sets: ExerciseSet[]) => void;
  onCancel: () => void;
}

// Component will render different fields based on exercise type
// Using the EXERCISE_TYPE_CONFIGS to determine which fields to show
```

#### 2.2 Update Exercise Search with Categories
```typescript
// src/features/exercises/ExerciseSearch.tsx
// Add category filtering
// Show exercise type badges
// Allow multiple category selection when adding exercises
```

#### 2.3 Create Stats Display Component
```typescript
// src/components/ExerciseStatsDisplay.tsx
// Dynamic display of relevant stats based on exercise type
// Hide irrelevant stats
// Format stats appropriately (time, distance, etc.)
```

### Phase 3: Database Migration

#### 3.1 Update Exercise Database
- Add `categories` field to all existing exercises
- Set appropriate `type` for all exercises
- Ensure exercises can have multiple categories

#### 3.2 Migration Script
```typescript
// scripts/migrateExerciseTypes.ts
// Update existing exercise logs to include type and categories
// Migrate existing sets to new structure
// Preserve backward compatibility
```

### Phase 4: Validation & Business Logic

#### 4.1 Exercise Type Validation
```typescript
// src/utils/exerciseValidation.ts
export const validateExerciseSet = (set: ExerciseSet, exerciseType: ExerciseType): ValidationResult => {
  const config = EXERCISE_TYPE_CONFIGS[exerciseType];
  const errors: string[] = [];
  
  // Validate required fields
  config.requiredStats.forEach(stat => {
    if (!set[stat as keyof ExerciseSet]) {
      errors.push(`${stat} is required for ${config.displayName} exercises`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
};
```

#### 4.2 Data Processing
```typescript
// src/utils/exerciseStatsCalculator.ts
// Calculate type-specific metrics
// Volume calculations for strength
// Total time calculations for endurance
// HR zone analysis
```

### Phase 5: Analytics & Reporting

#### 5.1 Type-Specific Analytics
- Strength: Total volume, progression tracking, RPE trends
- Endurance: Distance totals, pace analysis, HR zone distribution
- Flexibility: Session duration, consistency tracking
- Team Sports: Activity time, intensity tracking

#### 5.2 Enhanced Export
- Include exercise type in exports
- Type-specific data formatting
- Category-based filtering for exports

## Files to Create/Modify

### New Files
1. `src/config/exerciseTypes.ts` - Exercise type configurations
2. `src/components/DynamicExerciseSetLogger.tsx` - Type-aware set logger
3. `src/components/ExerciseStatsDisplay.tsx` - Dynamic stats display
4. `src/utils/exerciseValidation.ts` - Type-specific validation
5. `src/utils/exerciseStatsCalculator.ts` - Stats calculations
6. `scripts/migrateExerciseTypes.ts` - Migration script

### Modified Files
1. `src/types/exercise.ts` - Add new types and interfaces
2. `src/types/sets.ts` - Extend ExerciseSet interface
3. `src/features/exercises/ExerciseSetLogger.tsx` - Make type-aware
4. `src/features/exercises/ExerciseSearch.tsx` - Add category support
5. `src/services/firebase/exerciseLogs.ts` - Handle new data structure
6. `src/utils/localStorageUtils.ts` - Support new data model
7. `src/data/exerciseDatabase.ts` - Add categories to exercises

## Testing Strategy

### 1. Unit Tests
- Exercise type validation
- Stats calculation functions
- Data migration logic

### 2. Integration Tests
- Exercise logging flow for each type
- Data persistence across types
- Category filtering and search

### 3. User Acceptance Tests
- Logging different exercise types
- Switching between exercise types
- Data export/import with new structure

## Rollout Plan

### Phase 1: Foundation (Week 1)
- Update data models
- Create configuration system
- Update basic logging flow

### Phase 2: UI Enhancement (Week 2)
- Implement dynamic set logger
- Update exercise search with categories
- Add stats display components

### Phase 3: Migration & Polish (Week 3)
- Run database migration
- Add validation and error handling
- Update analytics and export features

### Phase 4: Testing & Deployment (Week 4)
- Comprehensive testing
- Performance optimization
- Deploy to production

## Success Criteria

✅ **Type-specific logging**: Each exercise type shows only relevant stats  
✅ **Data integrity**: All existing data is preserved during migration  
✅ **User experience**: Consistent UI layout across all exercise types  
✅ **Performance**: No degradation in app performance  
✅ **Analytics**: Enhanced insights based on exercise types  
✅ **Extensibility**: Easy to add new exercise types in the future  

## Risk Mitigation

- **Data loss**: Comprehensive backup before migration
- **Performance**: Incremental loading and efficient queries
- **User confusion**: Clear labeling and help text for new fields
- **Backward compatibility**: Support for legacy data structures
