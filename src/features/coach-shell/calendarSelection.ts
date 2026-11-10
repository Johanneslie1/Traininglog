export interface CalendarCell {
  athleteId: string;
  date: string;
}

export interface BulkPlaceTarget {
  athleteId: string;
  date: string;
  assignmentId?: string;
}

const CELL_SEP = '|';

export function cellKey(cell: CalendarCell): string {
  return `${cell.athleteId}${CELL_SEP}${cell.date}`;
}

export function parseCellKey(key: string): CalendarCell | null {
  const separator = key.indexOf(CELL_SEP);
  if (separator <= 0 || separator === key.length - 1) return null;
  return {
    athleteId: key.slice(0, separator),
    date: key.slice(separator + 1),
  };
}

export function toggleCellKey(selected: Set<string>, cell: CalendarCell): Set<string> {
  const key = cellKey(cell);
  const next = new Set(selected);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function toggleAthleteAcrossDates(
  selected: Set<string>,
  athleteId: string,
  dates: string[]
): Set<string> {
  const keys = dates.map((date) => cellKey({ athleteId, date }));
  const allSelected = keys.length > 0 && keys.every((key) => selected.has(key));
  const next = new Set(selected);
  keys.forEach((key) => {
    if (allSelected) next.delete(key);
    else next.add(key);
  });
  return next;
}

export function toggleDateAcrossAthletes(
  selected: Set<string>,
  date: string,
  athleteIds: string[]
): Set<string> {
  const keys = athleteIds.map((athleteId) => cellKey({ athleteId, date }));
  const allSelected = keys.length > 0 && keys.every((key) => selected.has(key));
  const next = new Set(selected);
  keys.forEach((key) => {
    if (allSelected) next.delete(key);
    else next.add(key);
  });
  return next;
}

export function selectedCellsFromKeys(selected: Set<string>): CalendarCell[] {
  return [...selected].flatMap((key) => {
    const cell = parseCellKey(key);
    return cell ? [cell] : [];
  });
}

export function selectionSummary(selected: Set<string>): {
  athleteCount: number;
  dayCount: number;
  cellCount: number;
} {
  const cells = selectedCellsFromKeys(selected);
  return {
    athleteCount: new Set(cells.map((cell) => cell.athleteId)).size,
    dayCount: new Set(cells.map((cell) => cell.date)).size,
    cellCount: cells.length,
  };
}

export function uniqueSelectedDates(selected: Set<string>): string[] {
  return [...new Set(selectedCellsFromKeys(selected).map((cell) => cell.date))].sort();
}

export function uniqueSelectedAthletes(selected: Set<string>): string[] {
  return [...new Set(selectedCellsFromKeys(selected).map((cell) => cell.athleteId))];
}

/** Cells that still need a write for this session (skip already placed). */
export function buildBulkPlaceTargets(
  selected: Set<string>,
  sessionId: string,
  placements: Array<{ id: string; athleteId: string; sessionId: string; plannedDates: string[] }>
): BulkPlaceTarget[] {
  return selectedCellsFromKeys(selected).flatMap((cell) => {
    const existing = placements.find(
      (placement) => placement.athleteId === cell.athleteId && placement.sessionId === sessionId
    );
    if (existing?.plannedDates.includes(cell.date)) return [];
    return [{
      athleteId: cell.athleteId,
      date: cell.date,
      assignmentId: existing?.id,
    }];
  });
}
