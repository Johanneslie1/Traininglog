# PR Title

Compact quick view for non-resistance exercises + preserve full metrics in storage/export

## Why

Reduce vertical space in exercise lists for non-resistance activities while keeping full metric visibility and data integrity.

## What changed

### UI
- Updated `src/components/ExerciseCard.tsx`
  - Non-resistance rows now default to a compact quick view.
  - Quick view includes `reps`, `distance`, and `height` (when present).
  - Added `Show metrics` / `Hide metrics` toggle to reveal full metric cards.
  - Added accessibility support with `aria-expanded`, `aria-controls`, and keyboard-focus styling.
  - Preserved existing actions and row behavior.

### Persistence
- Updated `src/services/activityService.ts`
  - Preserves all set properties for non-resistance logging flows.
  - Normalizes common aliases (`time` -> `duration`, `averageHR` -> `averageHeartRate`, etc.).
  - Keeps Firestore-safe payloads via undefined-field cleanup.
- Updated `src/services/exerciseService.ts`
  - Added `prepareExerciseLogForPersistence()` to preserve all set metrics and remove undefined values.

### Export / Backup
- Updated `src/services/exportService.ts`
  - Added `serializeSetForExport()` to produce consistent set export rows.
  - Exports all core non-resistance fields plus hidden metrics with names aligned to `src/types/sets.ts`.
  - Extended activity-specific CSV headers for non-resistance types.
- Updated `src/services/backupService.ts`
  - JSON backup now also includes logs from `users/{uid}/activities`.

### Tests
- Updated `src/tests/ExerciseCard.test.tsx`
  - Verifies compact quick view defaults and metrics toggle behavior.
- Added `src/tests/nonResistancePersistence.test.ts`
  - Verifies non-resistance metrics are preserved in save flows.
- Added `src/tests/exportService.test.ts`
  - Verifies serialized export rows include all expected non-resistance fields.

## Acceptance criteria coverage

- Quick view default for non-resistance exercises: ✅
- `Show metrics` toggle reveals full metric UI: ✅
- Full metrics persist to storage even when hidden in UI: ✅
- Export/backup includes quick-view + hidden metrics: ✅

## Testing steps

- `npm run test`
- `npm run dev`
- Manual checks documented in `NON_RESISTANCE_QUICK_VIEW_VERIFICATION.md`

## Type/service notes

- `ExerciseSet` remains source of truth for set fields.
- Persistence and export now share stronger undefined-field cleanup and normalization patterns.

---

## Commit message

`feat: compact non-resistance quick view with full metric persistence/export`
