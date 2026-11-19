const COACH_EMAILS = ['johanneslie003@gmail.com'];

/** Coach access follows the Firebase Auth email, not the editable profile role. */
export function isCoachEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && COACH_EMAILS.includes(normalized));
}

export function resolveAppRole(email: string | null | undefined): 'athlete' | 'coach' {
  return isCoachEmail(email) ? 'coach' : 'athlete';
}
