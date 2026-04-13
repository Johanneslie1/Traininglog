# UI Overlap Fix - Z-Index Hierarchy

## Problem

UI components were overlapping incorrectly when opening modals within modals. Specifically:
- SessionBuilder (z-[100]) opens
- User clicks "Add Exercise" → ProgramAddExerciseOptions (z-[90]) appears BEHIND SessionBuilder ❌
- User selects a picker → Pickers (z-70) appear BEHIND ProgramAddExerciseOptions ❌

This created an unusable interface where users couldn't see or interact with the modals they opened.

## Root Cause

Incorrect z-index hierarchy. Components that should appear "on top" had lower z-index values than their parent modals.

### Old (Broken) Hierarchy:
```
SessionBuilder:              z-[100] (base)
ProgramAddExerciseOptions:   z-[90]  (LOWER - appears behind!)
Pickers:                     z-70    (EVEN LOWER - appears behind everything!)
```

## Solution

Updated z-index values to create proper layering hierarchy:

### New (Correct) Hierarchy:
```
SessionBuilder:              z-[100] (base modal)
ProgramAddExerciseOptions:   z-[110] (opens from SessionBuilder, appears on top)
Pickers:                     z-[120] (opens from AddExerciseOptions, appears on top)
```

## Changes Made

### 1. ProgramAddExerciseOptions.tsx
Updated ALL instances from `z-[90]` to `z-[110]`:

- Universal search view (line ~73)
- Activity picker view (line ~204)
- Resistance training view (line ~249)
- Main view (line ~313)

**Total: 5 z-index updates**

### 2. ExerciseDatabasePicker.tsx
Updated from `z-70` to `z-[120]`:

- Main modal (line ~195)

**Total: 1 z-index update**

### 3. ExerciseHistoryPicker.tsx
Updated from `z-70` to `z-[120]`:

- Loading state (line ~302)
- Error state (line ~315)
- Main modal (line ~333)

**Total: 3 z-index updates**

### 4. ProgramExercisePicker.tsx
Updated from `z-70` to `z-[120]`:

- Loading state (line ~112)
- Error state (line ~126)
- No programs state (line ~150)
- Library view (line ~203)
- Main view (line ~261)

**Total: 5 z-index updates**

## Technical Notes

### Why These Specific Values?

- **z-[100]**: Base modal layer for SessionBuilder
- **z-[110]**: +10 increment ensures clear separation
- **z-[120]**: +10 increment maintains consistent spacing

### Z-Index Best Practices

1. **Use increments of 10** - Allows room for future additions between layers
2. **Use bracket notation** - `z-[120]` for custom values not in Tailwind's default scale
3. **Document hierarchy** - Keep track of which components appear at which layers
4. **Consistent naming** - Group related modals at similar z-index levels

### Complete App Z-Index Map

```
Layout/Chrome:           z-10  (navbar, sidebar)
Overlays:                z-50  (tooltips, dropdowns)
Base Modals:             z-[100] (SessionBuilder, ProgramBuilder)
Secondary Modals:        z-[110] (ProgramAddExerciseOptions)
Tertiary Modals:         z-[120] (Pickers: Database, History, Program)
Alerts/Notifications:    z-[200] (if needed in future)
```

## Testing

### Test Modal Layering
1. Open a program
2. Open SessionBuilder (click "Add Session" or edit existing)
3. Click "Add Exercise" button
4. **Expected**: ProgramAddExerciseOptions appears clearly on top of SessionBuilder
5. Click "Add from Program" or "Copy from Previous"
6. **Expected**: Picker modal appears clearly on top of ProgramAddExerciseOptions
7. All buttons and content should be clickable
8. No overlapping text or UI elements

### Visual Indicators
- ✅ Each modal level should have distinct backdrop opacity
- ✅ Text should be readable at all levels
- ✅ Click areas should not overlap incorrectly
- ✅ Close buttons should always be accessible

## Benefits

✅ **Proper Layering**: Modals appear in correct order
✅ **Usable Interface**: All buttons and content are accessible
✅ **Clear Hierarchy**: Users can understand which modal they're in
✅ **No Overlap**: Text and buttons don't overlap incorrectly
✅ **Consistent UX**: Follows standard modal stacking patterns

## Files Modified

1. `src/features/programs/ProgramAddExerciseOptions.tsx` - 5 z-index updates
2. `src/features/programs/ExerciseDatabasePicker.tsx` - 1 z-index update
3. `src/features/programs/ExerciseHistoryPicker.tsx` - 3 z-index updates
4. `src/features/programs/ProgramExercisePicker.tsx` - 5 z-index updates

**Total: 14 z-index fixes across 4 files**

## Related Issues

- Fixes modal overlap when adding exercises to program sessions
- Resolves picker modals appearing behind parent modals
- Improves overall modal UX in program builder

---

**Status**: ✅ Complete
**Date**: October 14, 2025
