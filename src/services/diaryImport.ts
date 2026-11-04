import { ActivityType } from '@/types/activityTypes';
import { DifficultyCategory } from '@/types/difficulty';
import { toLocalDateString } from '@/utils/dateUtils';
import { orderedTimestampForIndex } from '@/utils/exerciseOrderTimestamps';

export type DiaryImportCollection = 'exercises' | 'activities';

export interface DiaryImportSet {
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  holdTime?: number;
  notes?: string;
  difficulty?: DifficultyCategory;
}

export interface DiaryImportEntry {
  id: string;
  name: string;
  collection: DiaryImportCollection;
  activityType: ActivityType;
  sets: DiaryImportSet[];
  supersetId?: string;
  supersetLabel?: string;
  orderIndex: number;
  timestamp: Date;
}

export interface DiaryImportSession {
  id: string;
  dateKey: string;
  name: string;
  durationMinutes?: number;
  sessionWeekKey: string;
  sessionNumberInDay: number;
  sessionNumberInWeek: number;
  startedAt: Date;
  entries: DiaryImportEntry[];
}

export interface DiaryImportStats {
  sessions: number;
  exercises: number;
  activities: number;
  sets: number;
  measurements: number;
  firstDate: string;
  lastDate: string;
}

export interface DiaryImportPlan {
  sessions: DiaryImportSession[];
  warnings: string[];
  stats: DiaryImportStats;
}

interface ParsedRow {
  date: string;
  type: string;
  name: string;
  value1?: number;
  unit1: string;
  value2?: number;
  unit2: string;
  comment: string;
}

interface WorkingSet {
  value1?: number;
  unit1: string;
  value2?: number;
  unit2: string;
  comment: string;
}

interface WorkingExercise {
  name: string;
  linked: boolean;
  sets: WorkingSet[];
}

interface WorkingMeasurement {
  name: string;
  value: number;
}

interface WorkingDay {
  dateKey: string;
  comment: string;
  exercises: WorkingExercise[];
  measurements: WorkingMeasurement[];
}

const DIFFICULTY_BY_COMMENT: Record<string, DifficultyCategory> = {
  hard: DifficultyCategory.HARD,
  easy: DifficultyCategory.EASY,
  normal: DifficultyCategory.NORMAL,
  medium: DifficultyCategory.NORMAL,
  warmup: DifficultyCategory.WARMUP,
  'warm-up': DifficultyCategory.WARMUP,
  drop: DifficultyCategory.DROP,
};

const usesMinuteHeuristic = (activityType: ActivityType): boolean =>
  activityType === ActivityType.ENDURANCE ||
  activityType === ActivityType.SPORT ||
  activityType === ActivityType.OTHER;

/** Store time so the log screen does not treat short efforts as legacy minutes. */
export const timedSetFields = (
  seconds: number,
  activityType: ActivityType
): Pick<DiaryImportSet, 'duration' | 'holdTime'> => {
  if (!(seconds > 0)) {
    return {};
  }

  const rounded = Math.round(seconds);
  if (usesMinuteHeuristic(activityType) && rounded <= 90) {
    return { holdTime: rounded };
  }

  if (activityType === ActivityType.STRETCHING && rounded <= 180) {
    return { holdTime: rounded };
  }

  return { duration: rounded };
};

export const toIsoWeekKey = (date: Date): string => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

export const parseDiarySessionComment = (
  comment: string
): { durationMinutes?: number; title?: string } => {
  const trimmed = comment.trim();
  if (!trimmed) {
    return {};
  }

  const match = trimmed.match(/^(\d+)\s*min\b\s*(?:\|\s*([\s\S]*))?$/i);
  if (!match) {
    return { title: trimmed };
  }

  const minutes = Number(match[1]);
  const title = (match[2] || '').trim();
  return {
    ...(minutes > 0 ? { durationMinutes: minutes } : {}),
    ...(title ? { title } : {}),
  };
};

const sessionDisplayName = (comment: string): { name: string; durationMinutes?: number } => {
  const parsed = parseDiarySessionComment(comment);
  if (parsed.title && parsed.durationMinutes) {
    return { name: `${parsed.title} · ${parsed.durationMinutes} min`, durationMinutes: parsed.durationMinutes };
  }
  if (parsed.title) {
    return { name: parsed.title };
  }
  if (parsed.durationMinutes) {
    return { name: `${parsed.durationMinutes} min`, durationMinutes: parsed.durationMinutes };
  }
  return { name: 'Diary' };
};

const parseCsv = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const text = csvText.replace(/^\uFEFF/, '');

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
};

const parseNumber = (value: string | undefined): number | undefined => {
  const trimmed = (value || '').trim().replace(',', '.');
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseDiaryDateKey = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return toLocalDateString(date);
};

const rowKind = (type: string): 'day' | 'exercise' | 'linked' | 'set' | 'measurement' | 'unknown' => {
  if (type.includes('📅')) return 'day';
  if (type.includes('📏')) return 'measurement';
  if (type.includes('🔹')) return 'set';
  if (type.includes('🔗')) return 'linked';
  if (type.includes('🏋')) return 'exercise';
  return 'unknown';
};

const difficultyFromComment = (comment: string): DifficultyCategory | undefined =>
  DIFFICULTY_BY_COMMENT[comment.trim().toLowerCase()];

const inferTimedActivity = (name: string): ActivityType => {
  const normalized = name.toLowerCase();
  if (/stretch|tøy|mobil|yoga|flexor|groin|hamstring|glute|plank|handstand|core|abbs|abs|crunch|flutter|balanse|spark|l-sit|lsit|lunge/.test(normalized)) {
    return ActivityType.STRETCHING;
  }
  if (/sykkel|bicycle|bike|cycle|row|intervall|run|løp|jog|swim|galpin|cardio/.test(normalized)) {
    return ActivityType.ENDURANCE;
  }
  if (/sprint|hurtighet|spenst|agility/.test(normalized)) {
    return ActivityType.SPEED_AGILITY;
  }
  return ActivityType.OTHER;
};

const appendNote = (notes: string | undefined, extra: string | undefined): string | undefined => {
  const parts = [notes, extra].map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : undefined;
};

const mapSet = (
  name: string,
  set: WorkingSet
): { collection: DiaryImportCollection; activityType: ActivityType; set: DiaryImportSet } | null => {
  const comment = set.comment.trim();
  const difficulty = difficultyFromComment(comment);
  const note = difficulty ? undefined : comment || undefined;
  const unit1 = set.unit1.trim().toLowerCase();
  const unit2 = set.unit2.trim().toLowerCase();
  const value1 = set.value1;
  const value2 = set.value2;

  if (unit1 === 'kg' && unit2 === 'rep') {
    const weight = value1 ?? 0;
    const reps = value2 ?? 0;
    if (weight === 0 && reps === 0 && !note) {
      return null;
    }
    return {
      collection: 'exercises',
      activityType: ActivityType.RESISTANCE,
      set: {
        weight,
        reps,
        ...(note ? { notes: note } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
    };
  }

  if (unit1 === 'sec' && unit2 === 'rep' && !(value1 && value1 > 0) && (value2 ?? 0) > 0) {
    return {
      collection: 'exercises',
      activityType: ActivityType.RESISTANCE,
      set: {
        weight: 0,
        reps: value2 ?? 0,
        ...(note ? { notes: note } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
    };
  }

  if (unit1 === 'sec' && unit2 === 'kg' && (value2 ?? 0) > 0) {
    const seconds = value1 ?? 0;
    return {
      collection: 'exercises',
      activityType: ActivityType.RESISTANCE,
      set: {
        weight: value2 ?? 0,
        reps: 0,
        ...timedSetFields(seconds, ActivityType.RESISTANCE),
        ...(note ? { notes: note } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
    };
  }

  const seconds = unit1 === 'sec' ? value1 ?? 0 : 0;
  const activityType = inferTimedActivity(name);
  let distance: number | undefined;
  let distanceNote: string | undefined;
  if ((unit2 === 'km' || unit2 === 'm') && (value2 ?? 0) > 0) {
    const meters = unit2 === 'km' ? Math.round((value2 ?? 0) * 1000) : Math.round(value2 ?? 0);
    if (meters > 100) {
      distance = meters;
    } else {
      distanceNote = `${meters} m`;
    }
  }

  const timed = timedSetFields(seconds, activityType);
  const reps = unit2 === 'rep' && (value2 ?? 0) > 0 ? value2 : undefined;
  const notes = appendNote(note, distanceNote);
  if (!timed.duration && !timed.holdTime && reps === undefined && distance === undefined && !notes) {
    return null;
  }

  return {
    collection: 'activities',
    activityType,
    set: {
      ...(reps !== undefined ? { reps } : {}),
      ...(distance !== undefined ? { distance } : {}),
      ...timed,
      ...(notes ? { notes } : {}),
    },
  };
};

const applySupersets = (
  entries: Array<DiaryImportEntry & { linked?: boolean }>,
  dateKey: string
): DiaryImportEntry[] => {
  let group: Array<DiaryImportEntry & { linked?: boolean }> = [];
  let groupIndex = 0;

  const close = () => {
    if (group.length >= 2) {
      const supersetId = `diary-${dateKey}-ss-${groupIndex + 1}`;
      group.forEach((entry, index) => {
        entry.supersetId = supersetId;
        entry.supersetLabel = `${groupIndex + 1}${String.fromCharCode(97 + index)}`;
      });
      groupIndex += 1;
    }
    group = [];
  };

  entries.forEach((entry) => {
    if (entry.linked && group.length > 0) {
      group.push(entry);
    } else {
      close();
      group = [entry];
    }
  });
  close();

  return entries.map((entry) => {
    delete entry.linked;
    return entry;
  });
};

const buildSession = (day: WorkingDay, warnings: string[]): DiaryImportSession | null => {
  const draft: Array<DiaryImportEntry & { linked?: boolean }> = [];
  const dayDate = new Date(`${day.dateKey}T12:00:00`);

  day.exercises.forEach((exercise) => {
    const mappedSets = exercise.sets
      .map((set) => mapSet(exercise.name, set))
      .filter((set): set is NonNullable<ReturnType<typeof mapSet>> => set !== null);

    if (mappedSets.length === 0) {
      return;
    }

    const activityType = mappedSets.some((set) => set.activityType === ActivityType.RESISTANCE)
      ? ActivityType.RESISTANCE
      : mappedSets[0].activityType;
    const collection: DiaryImportCollection = activityType === ActivityType.RESISTANCE ? 'exercises' : 'activities';

    draft.push({
      id: '',
      name: exercise.name.trim(),
      collection,
      activityType,
      sets: mappedSets.map((set) => set.set),
      orderIndex: draft.length,
      timestamp: orderedTimestampForIndex(dayDate, draft.length),
      linked: exercise.linked,
    });
  });

  day.measurements.forEach((measurement) => {
    draft.push({
      id: '',
      name: measurement.name.trim() || 'Body weight',
      collection: 'activities',
      activityType: ActivityType.OTHER,
      sets: [{ weight: measurement.value, notes: `${measurement.value} kg` }],
      orderIndex: draft.length,
      timestamp: orderedTimestampForIndex(dayDate, draft.length),
      linked: false,
    });
  });

  if (draft.length === 0) {
    return null;
  }

  draft.forEach((entry, index) => {
    entry.id = `diary-${day.dateKey}-${String(index + 1).padStart(3, '0')}`;
    entry.orderIndex = index;
    entry.timestamp = orderedTimestampForIndex(dayDate, index);
  });

  const named = sessionDisplayName(day.comment);
  const name = day.exercises.length === 0 && day.measurements.length > 0 && named.name === 'Diary'
    ? 'Body weight'
    : named.name;
  const entries = applySupersets(draft, day.dateKey);
  if (entries.some((entry) => !entry.name)) {
    warnings.push(`${day.dateKey}: skipped an exercise with no name`);
  }

  return {
    id: `diary-${day.dateKey}-main`,
    dateKey: day.dateKey,
    name,
    durationMinutes: named.durationMinutes,
    sessionWeekKey: toIsoWeekKey(dayDate),
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
    startedAt: entries[0].timestamp,
    entries: entries.filter((entry) => entry.name),
  };
};

export const buildDiaryImportPlan = (csvText: string): DiaryImportPlan => {
  const rows = parseCsv(csvText);
  const warnings: string[] = [];
  const days = new Map<string, WorkingDay>();
  let current: WorkingDay | null = null;
  let currentExercise: WorkingExercise | null = null;
  let measurements = 0;

  rows.slice(1).forEach((columns, index) => {
    const rowNumber = index + 2;
    const parsed: ParsedRow = {
      date: columns[0] || '',
      type: columns[1] || '',
      name: (columns[2] || '').trim(),
      value1: parseNumber(columns[4]),
      unit1: columns[5] || '',
      value2: parseNumber(columns[6]),
      unit2: columns[7] || '',
      comment: columns[8] || '',
    };

    if (!parsed.date && !parsed.type) {
      return;
    }

    const dateKey = parseDiaryDateKey(parsed.date);
    if (!dateKey) {
      warnings.push(`Row ${rowNumber}: could not read date "${parsed.date}"`);
      return;
    }

    const kind = rowKind(parsed.type);
    const ensureDay = (): WorkingDay => {
      const existing = days.get(dateKey);
      if (existing) {
        current = existing;
        return existing;
      }
      const created: WorkingDay = { dateKey, comment: '', exercises: [], measurements: [] };
      days.set(dateKey, created);
      current = created;
      return created;
    };

    if (kind === 'day') {
      const day = ensureDay();
      day.comment = parsed.comment.trim();
      currentExercise = null;
      return;
    }

    if (kind === 'exercise' || kind === 'linked') {
      const day = ensureDay();
      currentExercise = { name: parsed.name, linked: kind === 'linked', sets: [] };
      day.exercises.push(currentExercise);
      return;
    }

    if (kind === 'set') {
      if (!current || current.dateKey !== dateKey || !currentExercise) {
        warnings.push(`Row ${rowNumber}: set "${parsed.name || 'unknown'}" has no exercise`);
        return;
      }
      currentExercise.sets.push({
        value1: parsed.value1,
        unit1: parsed.unit1,
        value2: parsed.value2,
        unit2: parsed.unit2,
        comment: parsed.comment,
      });
      return;
    }

    if (kind === 'measurement') {
      const value = parsed.value1;
      if (value === undefined) {
        warnings.push(`Row ${rowNumber}: measurement "${parsed.name}" has no value`);
        return;
      }
      const day = ensureDay();
      day.measurements.push({ name: parsed.name || 'Body weight', value });
      measurements += 1;
      currentExercise = null;
      return;
    }

    warnings.push(`Row ${rowNumber}: unrecognized row type`);
  });

  const sessions = [...days.values()]
    .map((day) => buildSession(day, warnings))
    .filter((session): session is DiaryImportSession => session !== null)
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  const weekCounts = new Map<string, number>();
  sessions.forEach((session) => {
    const next = (weekCounts.get(session.sessionWeekKey) || 0) + 1;
    weekCounts.set(session.sessionWeekKey, next);
    session.sessionNumberInWeek = next;
  });

  const exercises = sessions.reduce(
    (sum, session) => sum + session.entries.filter((entry) => entry.collection === 'exercises').length,
    0
  );
  const activities = sessions.reduce(
    (sum, session) => sum + session.entries.filter((entry) => entry.collection === 'activities').length,
    0
  );
  const sets = sessions.reduce(
    (sum, session) => sum + session.entries.reduce((entrySum, entry) => entrySum + entry.sets.length, 0),
    0
  );

  return {
    sessions,
    warnings,
    stats: {
      sessions: sessions.length,
      exercises,
      activities,
      sets,
      measurements,
      firstDate: sessions[0]?.dateKey || '',
      lastDate: sessions[sessions.length - 1]?.dateKey || '',
    },
  };
};
