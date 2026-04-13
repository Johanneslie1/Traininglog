# Copilot Instructions for TrainingLog App

## Architecture Overview

React/TypeScript training logging PWA using Vite, Firebase (Auth + Firestore), Redux Toolkit, and Tailwind CSS. Deployed to GitHub Pages via HashRouter.

### Key Layers
- **Features** (`src/features/`): Domain modules (exercises, programs, auth, templates)
- **Services** (`src/services/`): Firebase operations and business logic
- **Context** (`src/context/`): React contexts for Programs, Supersets, Settings, Theme
- **Types** (`src/types/`): TypeScript interfaces - always check here first

### Data Flow
```
UI Components → Context/Hooks → Services → Firebase (Firestore)
                    ↓
              Redux (auth only) → store/store.ts
```

## Activity Type System (Critical)

The app supports 6 activity types defined in `src/types/activityTypes.ts`:
```typescript
ActivityType.RESISTANCE | SPORT | STRETCHING | ENDURANCE | SPEED_AGILITY | OTHER
```

Each type has:
- Different tracked metrics (see `src/types/sets.ts` for `ExerciseSet` fields)
- Separate JSON exercise databases in `src/data/exercises/*.json`
- Type-specific configs in `src/config/trainingTypeConfig.ts`

**When adding features, check the `activityType` field** - it determines which fields to display and track.

## File Conventions

### Imports
Always use the `@/` path alias (configured in vite.config.ts):
```typescript
import { Exercise } from '@/types/exercise';
import { db } from '@/services/firebase/config';
```

### Component Structure
- Features: `src/features/{domain}/` (e.g., programs, exercises, auth)
- Shared components: `src/components/`
- Layout: `src/components/layout/Layout.tsx`

### Firestore Collections
- `users/{userId}/exercises` - User's logged exercises
- `users/{userId}/exerciseLogs` - Exercise log entries
- `programs/{programId}` - Training programs
- `programs/{programId}/sessions` - Program sessions (subcollection)

**Critical**: All Firestore writes must include `userId` field. See `firestore.rules` for ownership validation.

## Key Types to Reference

```typescript
// src/types/exercise.ts
interface Exercise { id, name, activityType, category, metrics, ... }

// src/types/sets.ts  
interface ExerciseSet { weight, reps, duration?, distance?, rpe?, ... }

// src/types/program.ts
interface Program { id, name, userId, sessions: ProgramSession[] }
interface ProgramSession { id, name, exercises: ProgramExercise[], userId }
```

## Development Commands

```bash
npm run dev          # Vite dev server on port 3000
npm run build        # TypeScript check + Vite build
npm run test         # Vitest tests
npm run test:watch   # Watch mode
npm run deploy       # Build + deploy to GitHub Pages
```

## Common Patterns

### Firebase Auth Check
```typescript
import { getAuth } from 'firebase/auth';

const getCurrentUserId = () => {
  const auth = getAuth();
  if (!auth.currentUser?.uid) throw new Error('User must be logged in');
  return auth.currentUser.uid;
};
```

### Service Pattern (see `src/services/programService.ts`)
- Always call `ensureAuth()` before Firestore operations
- Use `removeUndefinedFields()` before writing to Firestore
- Implement validation functions throwing custom errors

### Context Pattern (see `src/context/ProgramsContext.tsx`)
- Fetch data on auth state change
- Provide CRUD operations and loading/error states
- Use `useCallback` for memoized functions

## Testing

Tests use Vitest in `src/tests/`. Setup file: `src/tests/setup.ts`.

```bash
npm run test                    # Run all tests
npm run test -- exercise.test   # Run specific test
```

## Gotchas

1. **HashRouter**: App uses `HashRouter` for GitHub Pages - paths include `#/`
2. **Firestore Timestamps**: Configure Redux serializable check to ignore Firebase timestamps
3. **Mobile Drag-Drop**: Uses `mobile-drag-drop` polyfill - imported in `App.tsx`
4. **PWA**: Service worker registration only in production mode

## Exercise Database Sources

- Resistance: `src/data/exercises.ts` (allExercises array)
- Other types: `src/data/exercises/*.json` files
- Loaded via `src/services/exerciseDatabaseService.ts`

## Build Notes

The app builds with `npm run build`. Known considerations:
- **Large chunks**: Firebase vendor (~550KB) and exercise data components are large. Use dynamic `import()` for new features to avoid inflating bundle size.
- **Lazy loading**: Routes use `React.lazy()` in `src/routes.tsx` - follow this pattern for new pages.
- **Browserslist**: Run `npx update-browserslist-db@latest` periodically to update browser targets.
