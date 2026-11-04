---
name: improve-app
description: >-
  Audits one TrainingLog area by reading its code and clicking through the
  running app, then reports UX, data, accessibility, mobile, and performance
  issues and applies only small safe fixes. Use when the user asks to improve,
  audit, review, or test an app area such as logging, programs, wellness,
  tests, habits, sports load, stats, teams, coach, or navigation.
disable-model-invocation: true
---

# Improve one app area

Audit exactly one area per run. Read [areas.md](areas.md) and use only the named section. If the user does not name an area, ask which one before reading code or opening the app. Do not audit the whole app in one pass.

## What to look for

Judge the area as an athlete or coach using it that day:

- Can the person finish the task without guessing?
- Can logged training, wellness, habits, tests, programs, or load show the wrong value, date, unit, or athlete?
- Can someone use it on a phone, with the keyboard, and with a screen reader label on each control?
- Does the screen load, update, or scroll slowly, or get stuck on a spinner?

Leave architecture, naming, and visual polish out of the report unless they cause one of those problems.

## Workflow

1. Read the matching section in [areas.md](areas.md), then the listed files and the services they call. Learn the expected behavior before clicking.
2. Reuse a running `npm run dev` server. Start one only if none is running. Open the area in the Cursor browser.
3. If the screen asks for login, stop and ask the user to sign in. Do not create an account. Do not create, edit, or delete persisted logs, wellness, habits, tests, programs, teams, or coach data. Open existing records and dialogs, then cancel.
4. On a desktop width, walk every flow in the area brief. Then repeat the main flow at about 390px wide. Check loading, empty, and error states when they appear without writing data.
5. Confirm a suspected bug in both the screen and the code. Note the route, the control, and the file.
6. Apply small safe fixes only after the report-worthy findings are clear. Verify each fix in the browser on the same flow. If confirming a fix needs a saved write, do not apply it.
7. Reply with the report. Do not commit.

Coach accounts can use athlete features. Coach-only routes stay coach-only. Keep existing Firestore paths and document shapes.

## Small safe fix

A small safe fix is local and visible: a missing accessible name, a focus trap, clipped text, a control that does nothing, a wrong empty-state sentence, or a spinner that never ends on a path you can see.

These are not safe fixes: Firestore paths or fields, auth or role checks, scoring for load, sRPE, wellness, habits, or tests, the meaning of an exercise-log field, migrations, new dependencies, new screens, and redesigns. Put those in the report and wait.

Cap a run at three small safe fixes. Stop after one if the next touches saved data or shared state used by another area.

## Report

```markdown
# [Area name]

## Tested
- Route, viewport, and what you clicked
- What you could not test, and why

## Findings
1. **[Short title]** — High | Medium | Low
   - Evidence: what happened, and the file or route
   - Why it matters to the athlete or coach
   - Recommendation

## Small fixes applied
- [What changed and how you verified it]
- Or: none

## Needs your decision
- Larger changes left untouched
```

Rank by how often the person hits the problem and how badly it misleads training data. Cite code with the project citation format when a finding depends on a specific function.
