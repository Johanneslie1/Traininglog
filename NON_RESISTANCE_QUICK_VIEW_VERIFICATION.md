# Non-Resistance Quick View Verification

## Automated checks

1. Run unit tests:
   - `npm run test`
2. Focused test coverage included:
   - `src/tests/ExerciseCard.test.tsx`
   - `src/tests/nonResistancePersistence.test.ts`
   - `src/tests/exportService.test.ts`

## Manual verification

1. Start the app:
   - `npm run dev`
2. Create one exercise for each non-resistance type:
   - ENDURANCE
   - SPEED_AGILITY
   - SPORT
   - STRETCHING
   - OTHER
3. In each exercise, log full metrics (including hidden ones such as duration, rpe, notes, holdTime, drillMetric, heart-rate metrics where relevant).
4. Confirm each row shows compact quick view by default:
   - Reps
   - Distance
   - Height (if present)
5. Activate `Show metrics` and verify full metric cards appear.
6. Verify accessibility:
   - Tab to `Show metrics`
   - Confirm focus outline is visible
   - Confirm `aria-expanded` switches between `false` and `true`
7. Reload the page and verify all entered metrics still appear after reopening `Show metrics`.
8. Export data from Settings:
   - CSV export should include quick-view fields and hidden metrics
   - JSON backup should include non-resistance activity logs and all set fields
9. Re-open exported files and confirm field names match `src/types/sets.ts` for set-level metrics.
