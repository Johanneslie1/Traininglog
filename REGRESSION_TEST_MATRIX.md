# Regression Test Matrix (Non-Resistance + Program/Export Consistency)

## Scope
- Canonical activity type normalization across logging/program flows
- Prescription duration/distance unit consistency
- Program session persistence integrity for non-resistance exercises
- Export completeness across `exercises` + `activities`
- Legacy migration behavior for existing program sessions

## Automated Checks

| Area | Check | Status |
|---|---|---|
| Type normalization | Build (`tsc && vite build`) | ✅ |
| Fallback removal | Search for `|| ActivityType.RESISTANCE` in `src` | ✅ (no matches) |
| Program persistence | Build after `programService` normalization/migration changes | ✅ |
| Export refactor | Build after unified export source changes | ✅ |
| Prescription unit normalization | Build after editor/utils/guide/assistant unit updates | ✅ |
| Unit tests | Vitest suite (`runTests`) | ✅ (39 passed, 0 failed) |

## Manual Validation Matrix

### 1) Program Builder + Session Builder
- Create a session with mixed activity types (`endurance`, `sport`, `stretching`, `speed_agility`, `other`).
- Save program, reload page, reopen same program.
- Verify each exercise retains correct activity badge and type-specific prescription display.
- Duplicate session and duplicate program; verify copied exercises preserve activity type + prescription.

### 2) Prescription Units
- Endurance/Sport structured prescription:
  - Enter duration in minutes and distance in km.
  - Save and reopen editor; values must remain unchanged.
  - Badge and guide card should show `min`/`km`.
- Stretching structured prescription:
  - Enter hold duration in seconds; verify display remains `s`.
- Speed/Agility structured prescription:
  - Enter distance in meters; verify display remains `m`.

### 3) Logging from Program Assignments
- Assign/share a session containing non-resistance exercises.
- Import session into daily log.
- Confirm each imported log entry keeps correct `activityType` and opens correct set logger behavior.

### 4) Export (Unified)
- Export with date range including both resistance and non-resistance logs.
- Verify exported `exerciseLogs` include rows originating from both `exercises` and `activities` collections.
- Verify set-level export:
  - `durationSec` converts endurance/sport minutes to seconds.
  - `distanceMeters` converts endurance/sport km to meters.
  - speed/stretching remain in their expected base units.

### 5) Legacy Migration
- Run `migrateLegacyDataForCurrentUser()` (or `migrateLegacyDataForUser(userId)`) for a user with old program sessions.
- Verify migrated sessions:
  - legacy activity type aliases become canonical enum values.
  - endurance/sport prescription duration values in seconds are converted to minutes.
- Re-open migrated programs and confirm unchanged UX except corrected units/types.

## Recommended Execution Order
1. Build check
2. Program creation/edit/duplicate checks
3. Prescription unit checks
4. Assignment import checks
5. Export checks
6. Migration run + post-migration verification

## Exit Criteria
- No activity type coercion to resistance in save/load/display paths
- Program exercise activity types remain stable after CRUD/duplication/share-copy
- Prescription duration units are consistent across editor, formatter, logger guidance, and assistant hints
- Export includes all activity categories with consistent unit columns
- Migration updates legacy records without data loss
