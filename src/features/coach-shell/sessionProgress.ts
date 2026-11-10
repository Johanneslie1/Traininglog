import type { DayTrainingLog, LoggedSet } from '@/features/coach-shell/monitorLines';

export type SessionProgressStatus = 'not-started' | 'started' | 'logging';

function setHasSavedNumber(set: LoggedSet): boolean {
  return (
    (typeof set.reps === 'number' && Number.isFinite(set.reps)) ||
    (typeof set.weight === 'number' && Number.isFinite(set.weight)) ||
    (typeof set.duration === 'number' && Number.isFinite(set.duration)) ||
    (typeof set.distance === 'number' && Number.isFinite(set.distance)) ||
    (typeof set.rpe === 'number' && Number.isFinite(set.rpe))
  );
}

/** Derive live progress from logs already matched to a session for today. */
export function sessionProgressStatus(logs: DayTrainingLog[]): SessionProgressStatus {
  if (logs.length === 0) return 'not-started';
  const hasLoggedNumber = logs.some((log) => log.sets.some(setHasSavedNumber));
  return hasLoggedNumber ? 'logging' : 'started';
}

export function sessionProgressLabel(status: SessionProgressStatus): string {
  switch (status) {
    case 'logging':
      return 'Logging';
    case 'started':
      return 'Started';
    default:
      return 'Not started';
  }
}
