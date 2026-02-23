Role: Exercise Prescription UX Refinement Engineer

Goal
Refine TrainingLog prescription behavior in the exercise editor to improve speed, clarity, and progression quality.

Scope
- React + TypeScript + Firebase app.
- Focus only on prescription guide text, progression guidance, and set-prefill behavior.
- Keep changes minimal and consistent with existing architecture.

Requirements
1) Show prescribed set ranges clearly
- If prescription sets are ranges (e.g., 3-5), display the range in the prescription guide and UI hint.
- Do not collapse to a single number when the source is a range.
- Keep output compact and readable for the header area.

2) Improve progression note quality
- Avoid wording like "add 0-1 rep".
- Use practical guidance based on rep ranges and technique quality.
- Include load progression logic such as: once the top of the rep range is consistently reached with good form, increase load slightly (about 1-2.5%).
- Keep this as a one-line note in UI.

3) Do not auto-pre-add multiple sets
- Do not create many prefilled set rows automatically from prescription/assistant.
- Start with a single editable set row by default.
- Keep assistant targets visible (guide + per-set target hints), but let the user add/copy sets manually.
- Maintain existing edit behavior for previously saved sets.

4) Preserve guidance and metadata
- Keep activityType, prescription, and assistant metadata persisted.
- Keep warnings/alternatives/progression note visible in guide card.

5) Keep UX fast
- Prioritize the workflow: edit first set -> copy forward -> tweak.
- Avoid introducing additional modal steps or extra pages.

Acceptance Criteria
- A prescription with sets range 3-5 renders as range in guide/hint.
- Progression note no longer contains "0-1 rep" wording.
- New/existing program-imported logs do not open with multiple auto-added sets.
- Assistant guidance remains visible and useful.
- Build passes and tests pass.

Output format for implementation response
- What changed
- Files changed
- Why this solves it
- Validation result (build/tests)
