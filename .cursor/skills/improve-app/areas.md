# Areas

Read one section per run. Paths are from the repo root.

## logging

Home training diary: log a session, change day, add or edit exercises and sets, review what was saved.

- Routes: `/`, `/exercises`, `/speed-agility`
- Code: `src/features/exercises/`, `src/features/daily-entry/`, `src/components/Calendar.tsx`, `src/components/ExerciseCard.tsx`, `src/services/firebase/exerciseLogs.ts`, `src/services/firebase/activityLogs.ts`, `src/utils/exerciseLogSummary.ts`
- Flows: open today, move to another day and back, open the calendar, start adding an exercise and cancel, open an existing log, check set order, units, and the session summary
- Watch for: the wrong day, duplicated or reordered sets, a summary that disagrees with the sets on screen, a save control that looks finished before data is on screen
- Mobile: date header, set rows, and the add-exercise sheet must stay usable without horizontal clipping

## programs

Build, open, and share a program or session, including rehab programs.

- Routes: `/programs`, `/programs/:id`, `/program-selection`
- Code: `src/features/programs/`, `src/services/programService.ts`, `src/context/ProgramsContext.tsx`, `src/types/program.ts`
- Flows: open the list, open one program, inspect a session and its exercises, open add-exercise and share dialogs and cancel, try an empty list state if it is already empty
- Watch for: exercises shown in a different order than the builder, prescriptions that do not match the log, a shared program pointing at the wrong athlete or team
- Mobile: session lists and exercise rows must remain tappable; dialogs must fit the width

## wellness

Daily wellness check-in.

- Route: `/wellness`
- Code: `src/features/wellness/`, wellness services under `src/services/`, `src/features/daily-entry/`
- Flows: open today, change the date, read each scale, open an existing entry without changing it
- Watch for: a saved score that displays on the wrong day or the wrong end of the scale, a field that looks required but can be skipped silently
- Mobile: scales and the date control must be usable with one thumb

## tests

Performance tests and assessments.

- Route: `/tests`
- Code: `src/features/tests/`, `src/services/assessmentService.ts`, `src/types/assessment.ts`, `src/utils/assessmentLog.ts`
- Flows: open the page, switch test type if offered, open an existing result, start an entry and cancel
- Watch for: units, best-result selection, and dates that disagree between the list and the detail
- Mobile: result lists and input sheets must not clip values

## habits

Mark habits and review the week or month.

- Route: `/habits`
- Code: `src/features/habits/`, `src/services/habitService.ts`, `src/utils/habitStats.ts`, `src/types/habit.ts`
- Flows: open today, mark nothing, move across the week, open the month, read the overview counts
- Watch for: a mark landing on the wrong date, a streak or count that disagrees with the marks on screen
- Mobile: week navigation and mark targets must be large enough to hit

## sports-load

Session load and sRPE. `/srpe` redirects to `/sports`.

- Route: `/sports`
- Code: `src/features/srpe/`, related load helpers under `src/services/` and `src/utils/`
- Flows: open the page, change the day, read duration, RPE, and calculated load for an existing session, start an entry and cancel
- Watch for: load that is not duration times RPE for the scale the UI claims, a session attached to the wrong day, a total that omits a visible session
- Mobile: numeric inputs must be usable without zooming the whole page into a broken layout

## stats

Athlete progress charts and the analytics view.

- Routes: `/stats`, `/analytics`
- Code: `src/features/stats/`, `src/pages/AnalyticsDashboard.tsx`, `src/features/health-dashboard/`, `src/utils/chartDataFormatters.ts`
- Flows: open Stats, change the date range or metric if those controls exist, open Analytics, compare a visible total with the underlying list
- Watch for: a chart point on the wrong date, a filter that does not change the series, a total that includes another athlete's data
- Mobile: charts must scroll or resize without covering their controls; axis labels must stay readable

## teams

Athlete team list, team detail, and joining.

- Routes: `/teams`, `/teams/:id`, `/join`, `/join/:inviteCode`
- Code: `src/features/teams/`
- Flows: open the hub, switch tabs, open a team, read announcements and activity, open join and cancel
- Watch for: the wrong team name, an announcement or activity from another team, a join code path that confirms success before membership exists
- Mobile: tabs and team rows must not require precise taps on desktop-sized hit areas

## coach

Coach hub and one athlete. Requires a coach account. If the current user is redirected to `/teams?tab=teams`, stop and ask for a coach sign-in. Do not change roles.

- Routes: `/coach`, `/coach/athlete/:athleteId`
- Code: `src/features/coach/`
- Flows: open the hub, open an athlete, read wellness, load, logs, programs, and announcements that are already visible, open an assign or announcement dialog and cancel
- Watch for: data from the wrong athlete, a coach control shown to an athlete, an athlete missing from the list who is on the team, ratings that disagree with the athlete screen
- Mobile: athlete lists and overview sections must stack without hidden actions

## navigation

Shell around the areas: menu, profile, settings, and signed-out entry.

- Routes: `/settings`, `/profile`, `/login`, `/register`, `/forgot-password`
- Code: `src/components/SideMenu.tsx`, `src/components/layout/Layout.tsx`, `src/features/settings/`, `src/features/profile/`, `src/features/auth/`
- Flows: open and close the menu, reach each top-level item, open Settings and Profile, check the signed-out screens only if already signed out
- Watch for: a menu item that lands on the wrong route, a current-page state that is wrong, a dialog that cannot be closed, focus that stays hidden behind the menu
- Mobile: the menu must fit the width, scroll when needed, and leave a way to close it
