# Implementation Prompts for TrainingLog App

Use these prompts with an AI coding assistant to implement each feature. Copy the relevant prompt and paste it into your conversation.

---

## Quick Reference: What Already Exists vs What to Build

### ✅ Already Implemented (No Action Needed)
- **Quick-add set copying previous values** - Both `UniversalSetLogger.tsx` and `SetEditorDialog.tsx` have this
- **Activity-type-specific form fields** - `UniversalSetLogger.tsx` dynamically renders fields per activity type
- **Drag handles on exercises** - `DraggableExerciseDisplay.tsx` has visible drag handles
- **Visual feedback during drag** - Scale and shadow effects exist
- **Export with all activity-specific columns** - `exportService.ts` exports all fields
- **Program CRUD operations** - Full create/edit/delete via `ProgramsContext`
- **Analytics data processing** - `analyticsService.ts` (613 lines) is complete
- **Chart data formatters** - `chartDataFormatters.ts` has volume formatting functions
- **PR detection utilities** - `prDetection.ts` exists with `getAllPRsByExercise()`

### 🔨 Needs Implementation
| Feature | Priority | Prompt |
|---------|----------|--------|
| Inline set editing (tap to edit) | High | 1.1 |
| Swipe-to-delete sets | High | 1.1 |
| Bottom navigation bar | Medium | 1.2 |
| Export date range selector UI | High | 3.1 |
| Separate CSV files per activity type | Medium | 3.2 |
| JSON backup/restore | Low | 3.3 |
| Analytics dashboard UI (charts) | High | 6.2 |
| PR display UI | Medium | 6.1 |
| Coach/athlete roles | Future | 5.1 |
| Team management | Future | 5.2-5.5 |
| Coach dashboard | Future | 6.3 |

---

## Phase 1: UI/UX Foundation

### Prompt 1.1: Streamlined Set Logging

**What Already Exists:**
- ✅ "Quick add set" copying previous values - implemented in `UniversalSetLogger.tsx` (`copyPreviousSet()` line ~380) and `SetEditorDialog.tsx` (`handleCopyPreviousSet()`)
- ✅ Activity-type-specific forms already work dynamically

**What Needs to be Added:**

```
I want to improve the set logging experience in my TrainingLog app. The app already has "copy previous set" functionality.

Requirements:
1. Make set values (weight, reps, etc.) directly editable by tapping on them in the set list (inline editing mode) - currently users must open the full editor
2. Add swipe-to-delete for sets on mobile using react-swipeable or similar
3. Show a better visual feedback when a set is successfully added (animation/toast)

The main set logging component is `src/features/exercises/ExerciseSetLogger.tsx`. For non-resistance exercises, it routes to `src/components/UniversalSetLogger.tsx`. For resistance exercises, it uses `src/components/SetEditorDialog.tsx`.

Key files to understand:
- Set data structure: `src/types/sets.ts` (ExerciseSet interface)
- Activity type configs: `src/config/trainingTypeConfig.ts`
- Current set display: Check how sets are displayed in the loggers above

Please implement inline editing and swipe-to-delete while keeping the existing activity-type-specific fields working.
```

### Prompt 1.2: Bottom Navigation Bar

```
Add a bottom navigation bar to my React/TypeScript training app for mobile-first navigation.

Requirements:
1. Create a BottomNav component with 4-5 main sections: Home, Log, Programs, Analytics, Settings
2. Show active state for current route
3. Hide on scroll down, show on scroll up (optional)
4. Only show for authenticated users
5. Position fixed at bottom, safe-area aware for iOS

The app uses React Router with HashRouter (see `src/providers.tsx`). The current layout is in `src/components/layout/Layout.tsx`.

Use Tailwind CSS for styling and @heroicons/react for icons (already installed). The app's color scheme uses bg-bg-primary (#1a1a1a) and text-text-primary.
```

### Prompt 1.3: Drag-to-Reorder Exercises

**What Already Exists:**
- ✅ Drag-and-drop using `react-beautiful-dnd` with `mobile-drag-drop` polyfill
- ✅ Drag handles on exercise cards (line 155 in DraggableExerciseDisplay: `w-12 h-1 bg-gray-400 rounded-full`)
- ✅ Visual feedback during drag (`scale-105 shadow-2xl` transform)
- ✅ Superset grouping works with drag-and-drop

**What Could Be Improved:**

```
The drag-and-drop for reordering exercises is already working in my TrainingLog app, but I want to improve the user experience.

Current state:
- Using `react-beautiful-dnd` with `mobile-drag-drop` polyfill (already set up)
- Drag handles exist in `src/components/DraggableExerciseDisplay.tsx`
- Visual feedback exists (scale and shadow on drag)

Improvement requirements:
1. Make drag handles more visible and touch-friendly (larger hit area, clearer icon)
2. Add drop zone highlighting when dragging over valid drop positions
3. Add haptic feedback on mobile if possible (vibration API)
4. Show position numbers on exercises that update during drag
5. Add "undo last reorder" functionality

Keep the existing superset grouping functionality working (see `src/context/SupersetContext.tsx`).
```

---

## Phase 2: Activity-Specific Metrics

### Prompt 2.1: Dynamic Activity-Specific Set Forms

**What Already Exists:**
- ✅ `UniversalSetLogger.tsx` (795 lines) already has full dynamic forms per activity type
- ✅ Different fields render based on `activityType` via `getExerciseType()` function
- ✅ Auto-calculates derived values (pace from duration/distance)
- ✅ All activity types have proper form rendering in `renderFieldsForSet()`

**This prompt may not be needed unless you want to refactor the existing implementation.**

```
The app already has activity-specific set forms in `src/components/UniversalSetLogger.tsx`. Review this component and suggest any improvements:

1. Check if form validation is comprehensive (positive numbers, reasonable ranges)
2. Check if smart defaults from exercise's last logged values are implemented
3. Verify mobile-friendly number inputs with appropriate keyboards
4. Suggest any UX improvements to the existing implementation

Current activity type handling:
- `getExerciseType()` function determines the type
- `getDefaultSet()` returns type-specific default fields
- `renderFieldsForSet()` renders dynamic UI per type
- `copyPreviousSet()` copies values from the last set

No major implementation needed - this is a review/refinement task.
```

### Prompt 2.2: Activity-Specific Exercise Cards

```
Create distinct exercise card designs for each activity type in workout displays.

Requirements:
1. Create `ActivityExerciseCard` component with variants for each activity type
2. Each variant should prominently display its key metrics:
   - Resistance: sets × reps @ weight, total volume
   - Endurance: distance, duration, pace, calories
   - Speed/Agility: drill name, reps, total time
   - Stretching: hold time, body part, intensity
   - Sport: duration, intensity level, notes preview
3. Use activity type colors consistently (defined in `ProgramBuilder.tsx` getActivityTypeInfo)
4. Compact view for workout list, expandable for details
5. Show mini-charts/progress indicators where relevant

The current card is `src/components/ExerciseCard.tsx`. Modify or create a new component that can replace it.
```

### Prompt 2.3: Exercise History with Last Values

```
Add "last performed" context when logging an exercise to help users with progressive overload.

Requirements:
1. When an exercise is selected for logging, fetch its last 3 occurrences
2. Display a summary: "Last time: 3×10 @ 60kg on Jan 15"
3. Add a "Copy last values" button to pre-fill the set form
4. Show a trend indicator (↑↓→) comparing to previous performance
5. Cache recent history to avoid repeated Firestore reads

The exercise history is stored in `users/{userId}/exercises` collection. Use the existing Firebase utilities in `src/services/firebase/`.

Create a custom hook `useExerciseHistory(exerciseName: string)` that provides this data.
```

---

## Phase 3: Enhanced Export System

### Prompt 3.1: Export Date Range Selector

**What Already Exists:**
- ✅ Export functionality in `src/components/Settings.tsx` 
- ✅ `exportService.ts` exports sessions, exerciseLogs, and sets with all activity-specific columns
- ✅ Downloads 3 separate CSVs (sessions.csv, exercise_logs.csv, exercise_sets.csv)
- ✅ `analyticsService.ts` has `getExercisesByDateRange()` function

**What Needs to be Added:**

```
Add date range selection to the export functionality in Settings.

Current state:
- Export button in `src/components/Settings.tsx` (line ~22 handleExport function)
- `src/services/exportService.ts` exports all data without date filtering
- `src/services/analyticsService.ts` already has `getExercisesByDateRange()` that could be leveraged

Requirements:
1. Add date picker UI in Settings before the Export button
2. Add preset range buttons: Last 7 days, Last 30 days, This month, Last month, All time
3. Show preview count before export: "X sessions, Y exercises, Z sets in selected range"
4. Pass date range to exportData() function
5. Use native HTML date inputs for simplicity (or react-calendar if more polish needed)

Update both:
- `src/components/Settings.tsx` - Add UI
- `src/services/exportService.ts` - Add optional startDate/endDate parameters
```

### Prompt 3.2: Activity-Specific Export Schemas

**What Already Exists:**
- ✅ Export service exports ALL activity-specific columns in one sets.csv file
- ✅ Columns include: weight, reps, durationSec, distanceMeters, rpe, rir, hrZone1-5, avgHR, maxHR, calories, height, holdTime, intensity, pace, elevation, etc.

**What Needs to be Added:**

```
Enhance the export to optionally create separate CSV files per activity type with only relevant columns.

Current state:
- `src/services/exportService.ts` exports everything in one exercise_sets.csv with ALL possible columns
- The file includes columns for every activity type, making it sparse for any single activity

Requirements:
1. Add a toggle in Settings: "Export separate files per activity type"
2. When enabled, create separate CSV files:
   - resistance_sets.csv: date, exercise, set#, weight, reps, RPE, RIR, volume, isWarmup
   - endurance_sets.csv: date, exercise, duration, distance, pace, avgHR, maxHR, hrZone1-5, calories
   - speed_agility_sets.csv: date, drill, reps, duration, height, performance
   - stretching_sets.csv: date, exercise, holdTime, sets, intensity, bodyPart
   - sport_sets.csv: date, activity, duration, intensity, heartRate, calories
3. Keep the default "all-in-one" export as an option
4. Add summary row at bottom of each file (totals, averages)

Create a new function in exportService: `downloadActivityCSVs(userId, options)`
```

### Prompt 3.3: JSON Export for Full Backup

```
Add JSON export option for complete data backup/restore capability.

Requirements:
1. Add "Export as JSON" button in Settings next to CSV export
2. Export complete user data: exercises, programs, settings
3. Structure the JSON with clear sections and metadata
4. Include schema version for future migration compatibility
5. Compress if over 1MB (optional)
6. Add "Import from JSON" to restore backups (Phase 2)

Create a new `src/services/backupService.ts` with:
- exportFullBackup(userId): Promise<BackupData>
- downloadBackupJson(data: BackupData): void
```

---

## Phase 4: Program & Template Improvements

### Prompt 4.1: Program Builder Drag-and-Drop

```
Improve the program builder with better drag-and-drop for sessions and exercises.

Current implementation is in `src/features/programs/ProgramBuilder.tsx` and `SessionBuilder.tsx`.

Requirements:
1. Drag sessions to reorder within a program
2. Drag exercises between sessions (move, not copy)
3. Visual drop zones with hover highlights
4. Keyboard accessibility for reorder (up/down arrows already exist)
5. Undo last reorder action

Use react-beautiful-dnd which is already set up in the project. Ensure the drag handles are clearly visible.
```

### Prompt 4.2: Quick Workout Templates

```
Add a template system for common workout patterns that can be applied with one tap.

Requirements:
1. Create predefined templates: "5×5 Strength", "3×10 Hypertrophy", "Pyramid", "Drop Sets"
2. Templates define set/rep structure, not specific exercises
3. "Apply template" button when adding an exercise
4. User can create custom templates
5. Store templates in localStorage or Firestore

Create `src/services/workoutTemplateService.ts` and UI components for template selection.
Template structure:
{
  id: string,
  name: string,
  description: string,
  sets: Array<{ reps: number | string, weightPercent?: number, rest?: number }>
}
```

### Prompt 4.3: Clone/Duplicate Programs

**✅ COMPLETED** - Duplicate functionality has been implemented.

```
Add ability to duplicate programs and sessions for quick variations.

Requirements:
1. "Duplicate" button on program cards in ProgramList
2. "Duplicate" button on session cards in ProgramDetail
3. Duplicated items get "(Copy)" suffix in name
4. All exercises and settings are copied
5. New IDs generated for all duplicated items

Modify `src/services/programService.ts` to add:
- duplicateProgram(programId: string): Promise<Program>
- duplicateSession(programId: string, sessionId: string): Promise<ProgramSession>
```



## Phase 5: Coaching & Team Features

### Prompt 5.1: User Role System

```
Add coach/athlete role system to user profiles.

Requirements:
1. Add `role` field to user profile: 'athlete' | 'coach' | 'both'
2. Role selection during registration or in Settings
3. Role stored in Firestore users collection
4. Update Redux auth slice to include role
5. Create `useUserRole()` hook for easy access

Modify:
- `src/features/auth/authSlice.ts` - add role to user state
- `src/features/auth/Register.tsx` - add role selection
- `src/components/Settings.tsx` - add role change option
- Create `src/hooks/useUserRole.ts`
```

### Prompt 5.2: Team Creation and Management

```
Implement team/group creation for coaches.

Requirements:
1. "Create Team" option in coach dashboard
2. Team has: name, description, invite code
3. Generate shareable invite link
4. View team members list
5. Remove members from team

Create new Firestore collection `teams/{teamId}` with subcollection `members/{memberId}`.

Create:
- `src/services/teamService.ts` - CRUD operations for teams
- `src/features/teams/TeamList.tsx` - list coach's teams
- `src/features/teams/TeamDetail.tsx` - manage a team
- `src/features/teams/CreateTeamModal.tsx` - new team form
```

### Prompt 5.3: Athlete Invitation Flow

```
Implement athlete invitation and acceptance flow.

Requirements:
1. Coach generates invite link or code
2. Athlete clicks link or enters code
3. Athlete sees team info and "Join" button
4. On join, athlete added to team members
5. Athlete sees team in their profile

Routes:
- `/join/:inviteCode` - join team page

Create:
- `src/features/teams/JoinTeam.tsx` - join team page
- Update `teamService.ts` with `joinTeam(inviteCode: string)`
- Update Firestore rules to allow joining
```

### Prompt 5.4: Coach Athlete View

```
Allow coaches to view their athletes' workout data.

Requirements:
1. Coach dashboard shows list of athletes from their teams
2. Click athlete to see their workout history (read-only)
3. Filter by date range
4. Summary stats: workouts this week/month, total volume
5. Cannot modify athlete data

Create:
- `src/features/coach/CoachDashboard.tsx` - main coach view
- `src/features/coach/AthleteOverview.tsx` - single athlete view
- Update Firestore rules to allow coach read access

Security: Verify coach-athlete relationship on every read.
```

### Prompt 5.5: Program Sharing with Team

```
Enable coaches to share programs with their team.

Requirements:
1. "Share with Team" button on program detail page
2. Select which team(s) to share with
3. Athletes see shared programs in "Assigned Programs" section
4. Coach can update shared program (changes reflect for all)
5. Athletes can copy shared program to make it their own

Create:
- `sharedPrograms` collection in Firestore
- Update `programService.ts` with share functions
- `src/features/programs/SharedProgramList.tsx` - athlete view of assigned programs
- Update ProgramDetail with share functionality
```

---

## Phase 6: Analytics & Progress Dashboard

### Prompt 6.1: Personal Records Tracking

**What Already Exists:**
- ✅ `analyticsService.ts` imports `getAllPRsByExercise` from `@/utils/prDetection`
- ✅ Types exist: `PersonalRecord` in `src/types/analytics.ts`
- ❌ No UI for displaying PRs exists

**What Needs to be Added:**

```
Implement personal records (PRs) UI and improve detection.

Current state:
- `src/utils/prDetection.ts` has `getAllPRsByExercise()` function
- `src/types/analytics.ts` has `PersonalRecord` type
- `src/services/analyticsService.ts` imports PR utilities
- No UI currently displays PRs

Requirements:
1. Show PR badge on exercise when a new PR is achieved during logging
2. Create PRs list page showing all-time records by exercise
3. Filter PRs by exercise name, activity type, date range
4. Celebrate new PRs with toast notification and animation
5. Different PR types: heaviest weight, most reps at weight, best volume, longest distance, fastest pace

Create:
- `src/features/analytics/PersonalRecords.tsx` - PR list view
- `src/components/PRBadge.tsx` - visual indicator (badge/icon)
- Add PR detection call in set logging flow (UniversalSetLogger, SetEditorDialog)
```

### Prompt 6.2: Training Volume Charts

**What Already Exists:**
- ✅ `src/services/analyticsService.ts` (613 lines) - full data processing service
- ✅ `src/utils/chartDataFormatters.ts` - has `formatVolumeChartData()` and `formatVolumeChartDataForRecharts()`
- ✅ `src/utils/volumeCalculations.ts` - volume calculation utilities
- ✅ Types: `VolumeDataPoint`, `MuscleVolumeData`, `TrainingFrequencyData` in analytics.ts
- ❌ No chart UI components exist
- ❌ `src/features/analytics/` directory doesn't exist

**What Needs to be Added:**

```
Add visual charts for training volume. The data processing is already built.

Current state:
- `src/services/analyticsService.ts` has all data aggregation methods
- `src/utils/chartDataFormatters.ts` has `formatVolumeChartData()` and `formatVolumeChartDataForRecharts()`
- `src/utils/volumeCalculations.ts` has calculation utilities
- Types already defined in `src/types/analytics.ts`

Requirements:
1. Create analytics feature folder: `src/features/analytics/`
2. Install recharts: `npm install recharts`
3. Weekly/monthly volume bar chart
4. Volume by muscle group pie/donut chart  
5. Exercise frequency chart
6. Date range selector
7. Responsive, touch-friendly on mobile
8. Add route to analytics page in `src/routes.tsx`

Create:
- `src/features/analytics/AnalyticsDashboard.tsx` - main view
- `src/features/analytics/VolumeChart.tsx`
- `src/features/analytics/MuscleGroupChart.tsx`  
- `src/features/analytics/FrequencyChart.tsx`

Use the existing analyticsService methods - don't duplicate data processing logic.
```

### Prompt 6.3: Coach Team Dashboard

```
Create a coach dashboard showing team overview and comparisons.

Requirements:
1. Summary cards: total athletes, workouts this week, average compliance
2. Athlete list sorted by recent activity
3. Mini-charts for team trends
4. Alerts for athletes who haven't logged in X days
5. Quick navigation to any athlete's detail

Create:
- `src/features/coach/TeamDashboard.tsx`
- `src/features/coach/AthleteCard.tsx`
- `src/features/coach/TeamAlerts.tsx`
- Update `analyticsService.ts` with team aggregation functions
```

---

## Utility Prompts

### Prompt: Streamline Sidebar Navigation

```
Remove unnecessary buttons from the left sidebar to simplify navigation.

Current location: `src/components/SideMenu.tsx`

Remove the following three buttons:
1. **Exercise Database** (lines ~87-92) - Users access exercises through the main exercise logging flow
2. **Workout Summary** (lines ~97-105) - Functionality not fully implemented and redundant with analytics
3. **Superset Guide** (lines ~118-126) - Documentation that doesn't need prominent placement

Additional cleanup:
- Remove `onShowWorkoutSummary` prop from SideMenuProps interface
- Remove `showSupersetGuide` state (line ~28)
- Remove SupersetGuide import (line ~7)
- Remove SupersetGuide modal component at bottom (lines ~191-194)
- Update parent component `src/components/layout/Layout.tsx` to remove the `onShowWorkoutSummary` prop passing

Keep the core navigation:
- Exercise Log
- Programs  
- Settings
- Auth buttons (Login/Logout)

This streamlines the UI to focus on essential features without removing actual functionality.
```

### Prompt: Add Loading States

```
Add consistent loading states throughout the app.

Requirements:
1. Create a reusable `LoadingSpinner` component
2. Create a `Skeleton` component for content placeholders
3. Add loading states to all data-fetching components
4. Show skeleton while loading, then fade in content
5. Consistent styling with app theme

Create:
- `src/components/common/LoadingSpinner.tsx`
- `src/components/common/Skeleton.tsx`
- Update major components to use loading states
```

### Prompt: Error Handling Improvements

```
Improve error handling and user feedback throughout the app.

Requirements:
1. Global error boundary with helpful message
2. Toast notifications for operation success/failure
3. Form validation with inline error messages
4. Network error detection with retry option
5. Log errors to console with context (already using `src/utils/logger.ts`)

The app already uses `react-hot-toast`. Standardize its usage.

Create:
- Update `src/components/ErrorBoundary.tsx` with better UI
- `src/utils/errorHandler.ts` - centralized error handling
- Consistent toast patterns for all operations
```

### Prompt: Offline Support

```
Enhance offline support for the PWA.

Requirements:
1. Show offline indicator in header
2. Queue operations when offline
3. Sync queued operations when back online
4. Persist form data in progress
5. Show sync status indicator

The app already has service worker setup in `vite.config.ts` with vite-plugin-pwa.

Create:
- `src/hooks/useOnlineStatus.ts`
- `src/services/offlineQueue.ts` - queue management
- `src/components/common/OfflineIndicator.tsx`
```

---

## How to Use These Prompts

1. **Copy the prompt** for the feature you want to implement
2. **Paste into your AI coding assistant** (Copilot, Claude, etc.)
3. **Review the generated code** - AI may need context corrections
4. **Test the implementation** - run `npm run dev` and test manually
5. **Run tests** - `npm run test` to ensure nothing broke
6. **Build** - `npm run build` to verify no TypeScript errors

## Tips for Best Results

- Provide additional context if the AI seems confused
- Break large prompts into smaller steps if needed
- Ask follow-up questions to refine implementations
- Always review generated Firestore rules for security
- Test on mobile viewport as well as desktop

