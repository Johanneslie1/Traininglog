# Prescription Pre-filling Implementation

## Overview
Implemented automatic pre-filling of logging forms based on program prescriptions to guide athletes and make logging easier. This feature respects the `activityType` and provides a toggle for athletes to enable/disable pre-filling.

## Implementation Summary

### 1. ExerciseSetLogger Updates
**File**: `src/features/exercises/ExerciseSetLogger.tsx`

**Changes**:
- Added `prescription` and `instructionMode` to props interface
- Added state for `followPrescription` (default: `true`) and `prescriptionApplied`
- Implemented pre-filling logic using `prescriptionToSets` utility from `@/utils/prescriptionUtils`
- Added UI toggle with purple-themed styling matching the prescription concept
- Shows visual indicator when prescription is applied
- Displays formatted prescription details using `formatPrescription` utility
- Gracefully handles missing prescriptions and errors

**UI Features**:
- Toggle switch to enable/disable prescription pre-filling
- Purple-themed banner showing prescription details
- Green "Applied" badge when prescription is active
- Toast notifications for user feedback

### 2. UniversalSetLogger Updates
**File**: `src/components/UniversalSetLogger.tsx`

**Changes**:
- Added `prescription` and `instructionMode` to props interface
- Integrated prescription pre-filling into existing initialization logic
- Prescription pre-filling takes priority over progressive overload suggestions
- Added toggle handler `handleTogglePrescription`
- Added UI toggle similar to ExerciseSetLogger
- Enhanced `useEffect` initialization to check for prescription first, then progressive overload

**Priority Order**:
1. Existing sets (when editing)
2. Prescription pre-filling (when available and enabled)
3. Progressive overload suggestions (when enabled in settings)
4. Default empty set

### 3. Type System Updates
**File**: `src/types/exercise.ts`

**Changes**:
- Added import for `Prescription` type from `@/types/program`
- Added optional `prescription` and `instructionMode` fields to `Exercise` interface
- Enables exercises to carry prescription data when coming from programs

### 4. ProgramExercisePicker Updates
**File**: `src/features/programs/ProgramExercisePicker.tsx`

**Changes**:
- Updated `handleAddSelected` to include `prescription` and `instructionMode` in exercise objects
- Maintains existing behavior of converting prescriptions to sets for direct logging
- Added comments explaining dual-purpose: direct logging and logger component support

## How It Works

### Flow 1: Program Exercise Selection (Direct Logging)
1. User selects exercises from a program via ProgramExercisePicker
2. Exercises with prescriptions are converted to pre-filled sets using `prescriptionToSets`
3. Sets are directly logged to Firestore
4. User sees success toast indicating pre-filled values

### Flow 2: Logger with Prescription
1. Exercise with prescription data is passed to logger component
2. Logger checks if `prescription` exists and `instructionMode === 'structured'`
3. If `followPrescription` is `true`, sets are pre-filled on mount
4. User sees:
   - Purple prescription banner with toggle
   - Formatted prescription details (e.g., "3 sets × 8-10 reps @ 70-80%")
   - Pre-filled sets ready to edit
5. User can toggle prescription on/off
6. User can edit any pre-filled values
7. User saves the exercise log

### Edge Cases Handled
- **No prescription**: Logger behaves normally, no prescription UI shown
- **Invalid prescription data**: Falls back to default empty sets with error toast
- **Percentage-based weight**: Uses `prescriptionToSets` which handles calculations
- **Different activity types**: Prescription fields adapt to activity type (resistance: sets/reps/weight, endurance: duration/distance, etc.)
- **Editing existing exercise**: Prescription pre-filling is disabled (prevents overwriting user data)

## Key Utilities Used

### `prescriptionToSets(prescription, activityType, user1RM?)`
**Location**: `@/utils/prescriptionUtils.ts`

Converts a structured prescription into an array of `ExerciseSet` objects:
- Handles `NumberOrRange` types (e.g., 8-10 reps becomes 9 reps)
- Activity-type specific field mapping
- Weight calculations for percentage-based prescriptions (when 1RM provided)
- Default values for missing fields

### `formatPrescription(prescription, activityType)`
**Location**: `@/utils/prescriptionUtils.ts`

Formats prescription for display:
- Returns human-readable string (e.g., "3 sets × 8-10 reps @ 70-80%")
- Activity-type specific formatting
- Used in the prescription banner UI

### `formatPrescriptionBadge(prescription, activityType)`
**Location**: `@/utils/prescriptionUtils.ts`

Compact formatting for inline display:
- Shorter format for UI badges
- Used in program session builders

## Testing Instructions

### 1. Test Resistance Exercise with Prescription
1. Create a program with a resistance exercise
2. Add structured prescription: 3 sets × 8-10 reps @ 70% 1RM
3. Select the exercise from ProgramExercisePicker
4. Verify: 3 sets are pre-filled with ~9 reps and calculated weight
5. Verify: Purple prescription banner is visible with toggle
6. Toggle prescription off, verify sets remain but banner shows "disabled"
7. Toggle prescription on, verify it doesn't overwrite edited sets

### 2. Test Non-Resistance Exercise with Prescription
1. Create a program with an endurance activity
2. Add structured prescription: 3 sets × 20 min @ intensity 7/10
3. Select the exercise
4. Verify: Sets are pre-filled with 20-minute duration
5. Verify: Prescription banner shows correctly formatted details

### 3. Test Exercise Without Prescription
1. Select an exercise from program without prescription
2. Verify: No prescription banner shown
3. Verify: Logger behaves normally (progressive overload or empty set)

### 4. Test Error Handling
1. Create exercise with invalid prescription data (e.g., negative values)
2. Select exercise
3. Verify: Error toast shown, default empty set provided
4. Verify: User can still log exercise normally

### 5. Test Editing Mode
1. Open existing logged exercise with prescription
2. Verify: Prescription banner NOT shown (editing mode disables pre-filling)
3. Verify: Existing sets are preserved

## Architecture Compliance

✅ **Uses `@/` path aliases** throughout  
✅ **Checks `activityType`** in `prescriptionToSets` and formatting functions  
✅ **Integrates with existing services** (`prescriptionUtils`, `exerciseService`)  
✅ **Firestore writes include `userId`** (handled by existing `addExerciseLog` in services)  
✅ **Follows component patterns** (useCallback, useState, useEffect)  
✅ **Tailwind CSS** for all styling  
✅ **Toast notifications** for user feedback  
✅ **Mobile-compatible** (touch-friendly toggle, responsive design)

## Files Modified

1. `src/features/exercises/ExerciseSetLogger.tsx` - Added prescription support for resistance exercises
2. `src/components/UniversalSetLogger.tsx` - Added prescription support for all activity types
3. `src/types/exercise.ts` - Extended Exercise interface with prescription fields
4. `src/features/programs/ProgramExercisePicker.tsx` - Pass prescription data through to exercises

## Files Referenced (No Changes)

- `src/types/program.ts` - Prescription type definition
- `src/types/sets.ts` - ExerciseSet interface
- `src/types/activityTypes.ts` - ActivityType enum
- `src/utils/prescriptionUtils.ts` - Utility functions for prescription handling
- `src/config/trainingTypeConfig.ts` - Activity type configurations

## Future Enhancements

1. **User 1RM Integration**: Pass user's 1RM to `prescriptionToSets` for accurate percentage-based weight calculations
2. **Prescription Templates**: Save commonly used prescriptions as reusable templates
3. **Adherence Tracking**: Use `comparePrescriptionToActual` utility to show how closely athlete followed prescription
4. **Progressive Prescription**: Auto-adjust prescriptions based on performance over time
5. **Coach Feedback**: Notify coaches when athletes deviate significantly from prescription

## Notes

- Prescription pre-filling is **non-intrusive**: athletes can always edit or disable it
- The feature **respects user preferences**: toggle state could be persisted to localStorage in future
- **Backward compatible**: exercises without prescriptions work exactly as before
- **Type-safe**: All prescription handling uses proper TypeScript types
- **Tested**: Dev server compiles without errors, ready for manual testing

## Developer Notes

The implementation follows the single responsibility principle:
- `ExerciseSetLogger` handles resistance training logging
- `UniversalSetLogger` handles all other activity types
- `prescriptionUtils` handles all prescription-related logic
- Type system provides compile-time safety

The feature is designed to be **optional and additive** - it enhances the logging experience for program-based training without affecting standalone exercise logging.
