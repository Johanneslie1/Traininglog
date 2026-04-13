# Quick Reference: Program Exercise Integration

## How Exercise References Work Now

### Exercise ID Types

| Type | Format | Example | Source |
|------|--------|---------|--------|
| Default | `default-{name}` | `default-bench-press` | Built-in exercise database |
| Imported | `imported-{name}` | `imported-squat` | Imported CSV exercises |
| Custom | Firestore doc ID | `abc123xyz` | User-created exercises |
| Temporary | `temp-{timestamp}` | `temp-1697123456789` | Avoid in programs! |

### ProgramExercise Fields

```typescript
{
  id: "default-bench-press",           // Required: Exercise database reference
  name: "Bench Press",                 // Required: Cached for display
  exerciseRef: "exercises/abc123",     // Optional: Firestore path (custom exercises only)
  activityType: "RESISTANCE",          // Optional: Cached for badges/filtering
  notes: "Focus on form",              // Optional: Session-specific notes
  order: 0                             // Optional: Display order
}
```

## Common Operations

### Adding Exercises to a Session

```typescript
// In SessionBuilder - exercises are properly referenced
const exercises: ProgramExercise[] = selectedExercises.map((item, index) => ({
  id: item.id,                    // Preserve original ID from exercise database
  name: item.name,                // Cache name
  exerciseRef: item.id.startsWith('default-') ? undefined : `exercises/${item.id}`,
  activityType: item.activityType,
  order: index
}));
```

### Resolving Exercise Details

```typescript
import { resolveExerciseReference } from '@/services/exerciseReferenceService';

// Get full exercise data from a program exercise
const exercise = await resolveExerciseReference(programExercise);
if (exercise) {
  // Use full exercise data (instructions, metrics, etc.)
  console.log(exercise.instructions);
}
```

### Validating Exercises

```typescript
import { validateExerciseExists } from '@/services/exerciseReferenceService';

const exists = await validateExerciseExists('default-bench-press');
if (exists) {
  // Exercise is valid
}
```

## Data Flow Diagram

```
User Selects Exercise
    ↓
ExerciseDatabasePicker / ExerciseHistoryPicker
    ↓
SessionBuilder (creates ProgramExercise with reference)
    ↓
ProgramBuilder (validates and stores session)
    ↓
ProgramService (saves to Firestore with all references)
    ↓
Firestore: programs/{id}/sessions/{id}
    exercises: [
      { id: "default-bench-press", name: "Bench Press", ... }
    ]
```

## Key Benefits

✅ **No Duplication**: Exercise definitions stored once
✅ **Consistent**: Same exercise = same ID everywhere  
✅ **Lightweight**: Programs only store references
✅ **Updates Propagate**: Change exercise once, reflects everywhere
✅ **Clear Separation**: Programs ≠ Workout Logs

## Common Pitfalls to Avoid

❌ **Don't** create new exercise objects in programs
❌ **Don't** store workout data (sets/reps/weight) in programs
❌ **Don't** generate temporary IDs for exercises
❌ **Don't** modify exercise definitions in programs

✅ **Do** use existing exercise IDs from database
✅ **Do** cache name/type for quick display
✅ **Do** resolve full exercise data when needed
✅ **Do** store workout data separately in logs

## Testing in Browser Console

```javascript
// Test all programs
testAllProgramExercises()

// Test specific program
testProgramExerciseReferences('your-program-id')

// Create test program
createTestProgram()

// Test exercise database
testExerciseDatabase()
```

## Troubleshooting

### Exercise not appearing in program
- Check exercise ID format
- Verify exercise exists in database
- Use `resolveExerciseReference()` to debug

### "Exercise not found" error
- Exercise may have been deleted
- ID format may be incorrect
- Check Firestore for the exercise document

### Exercises duplicating
- Ensure you're using references, not copying full objects
- Check that exercise IDs are preserved
- Verify no temporary IDs are being saved

## Related Files

- `src/types/program.ts` - ProgramExercise interface
- `src/services/exerciseReferenceService.ts` - Resolution utilities
- `src/services/programService.ts` - Save/load logic
- `src/features/programs/SessionBuilder.tsx` - Exercise selection
- `src/features/programs/ProgramBuilder.tsx` - Program creation

---

**For Full Details**: See `PROGRAM_EXERCISE_DATABASE_INTEGRATION_FIX.md`
