Role: Senior React + Firebase Debugging Engineer (Coach Experience Consolidation Lead)

Context
- Project: TrainingLog PWA (React + TypeScript + Firebase + Redux Toolkit + Tailwind + HashRouter)
- Goal 1: Fix coach console/runtime issues (especially RangeError: Invalid time value).
- Goal 2: Merge coach Dashboard and My Teams into one unified coach view because they overlap heavily.
- Keep changes minimal, production-safe, and consistent with existing architecture.

Observed issues from console
1) Hard error (must fix)
- RangeError: Invalid time value
- Stack points to: src/services/coachService.ts in getAthleteSummaryStats around Date.toISOString()
- This currently breaks athlete loading in coach views.

2) High-noise duplicate calls/logs (must reduce)
- Duplicate fetch patterns for:
  - getAllAthletes / getAthleteSummaryStats
  - getCoachTeams / getTeamMembers
  - program/session fetches and some state persistence logs
- Duplicates are especially visible in development and likely amplified by React StrictMode + repeated effect initialization.

3) UX duplication
- Coach Dashboard and My Teams are separate routes but share similar team-management purpose.
- Coach side menu currently shows both Dashboard and My Teams, creating fragmented UX.

Code areas to inspect first
- src/services/coachService.ts
- src/features/coach/CoachDashboard.tsx
- src/features/coach/AthleteList.tsx
- src/features/teams/TeamList.tsx
- src/features/teams/AthleteTeamsHub.tsx
- src/routes.tsx
- src/components/SideMenu.tsx
- src/utils/statePersistence.ts
- src/App.tsx
- src/main.tsx

Required implementation tasks
A) Fix Invalid time value in coach service
- In getAthleteSummaryStats:
  - Add robust date parsing for exercise docs.
  - Support possible date shapes from Firestore records:
    - ISO string in data.date
    - Firestore Timestamp in data.timestamp
    - Date object
  - Exclude invalid dates before sorting/comparison/toISOString.
  - Never call toISOString on invalid Date.
  - If no valid dates, set lastActive undefined and continue without throwing.
- Ensure workoutsThisWeek/workoutsThisMonth only count records with valid parsed dates.

B) Make coach stats loading resilient and less repetitive
- Avoid N+1 relationship checks for each athlete where practical.
  - verifyCoachAthleteRelationship currently refetches teams/members repeatedly.
  - Refactor to reuse already fetched coach team membership when getAllAthletes is running.
- Keep security behavior equivalent (no permission regression).

C) Reduce duplicate side effects in development
- Evaluate StrictMode-induced duplicate effects before changing behavior.
- Make effects idempotent where needed:
  - state persistence auto-save listeners should not be registered multiple times without cleanup/guard.
  - avoid duplicate initial fetch bursts where a guard/ref can safely prevent redundant requests.
- Do not remove StrictMode globally unless absolutely necessary.

D) Merge Coach Dashboard + My Teams into one unified coach view
- Build a single Coach Hub page under /coach with tabbed sections (at minimum):
  - Overview (summary cards)
  - Teams (team management list/create flow)
  - Athletes (existing athlete list)
- Reuse existing components/logic where possible (TeamList, AthleteList, dashboard cards).
- For coach users, route /teams to unified coach hub (or coach teams tab) to avoid duplicate pages.
- Preserve athlete behavior on /teams (AthleteTeamsHub tabs) for non-coach users.
- Update side menu for coach:
  - Replace separate Dashboard + My Teams entries with one Coach Hub entry.

E) Routing and compatibility
- Keep deep links working:
  - /teams/:id still opens team detail.
  - /coach/athlete/:athleteId still opens athlete overview.
- Ensure hash routing behavior remains correct.

F) Logging cleanup
- Keep useful error logs.
- Remove or downgrade noisy repetitive info logs in hot paths.
- No behavior changes solely for cosmetic logging unless it reduces real noise from duplicate effects.

Acceptance criteria
1) No RangeError: Invalid time value when loading coach athletes.
2) Coach athletes list loads successfully even when some exercise documents have malformed/legacy dates.
3) Duplicate fetches/log noise are noticeably reduced in development.
4) Coach sees one consolidated coach page instead of separate overlapping Dashboard/My Teams pages.
5) Athlete teams/programs/sessions flow remains intact.
6) TypeScript passes and app builds.

Validation steps
- Run targeted checks first:
  - navigate to /coach
  - open athlete list and athlete overview
  - navigate between /coach and /teams as coach and as athlete
- Then run:
  - npm run build
  - relevant tests if present for coach/team services and routing

Implementation constraints
- Use existing theme tokens/components (no new design system).
- Keep changes surgical; do not refactor unrelated modules.
- Preserve Firestore ownership assumptions and current data model.
- Do not add new external dependencies unless truly necessary.

Deliverables
1) Code changes implementing A-F.
2) Short summary:
  - root cause(s)
  - files changed
  - why the final approach is safe
3) Any follow-up migration notes if legacy date fields are discovered frequently.
