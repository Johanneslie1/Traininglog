import type { SportsLoadSession } from '@/types/srpe';

export interface SportsLoadOverviewLine {
  id: string;
  label: string;
  detail: string;
}

/** Presentational row for Session overview sports-load block. */
export function sportsLoadOverviewLine(session: SportsLoadSession): SportsLoadOverviewLine {
  const label =
    session.sessionName?.trim()
    || session.sportName?.trim()
    || session.sportType?.trim()
    || 'Sports load';

  const parts: string[] = [];
  if (typeof session.rpe === 'number' && Number.isFinite(session.rpe)) {
    parts.push(`RPE ${session.rpe}`);
  }
  if (typeof session.durationMinutes === 'number' && Number.isFinite(session.durationMinutes)) {
    parts.push(`${session.durationMinutes} min`);
  }
  if (typeof session.sessionLoad === 'number' && Number.isFinite(session.sessionLoad)) {
    parts.push(`Load ${Math.round(session.sessionLoad)}`);
  }

  return {
    id: session.id,
    label,
    detail: parts.join(' · ') || 'Logged',
  };
}
