import { dateKeyToLocalDate, toLocalDateString } from '@/utils/dateUtils';
import {
  AssessmentKind,
  AssessmentLog,
  AssessmentWrite,
  BODY_COMPOSITION_METHODS,
  BodyCompositionDraft,
  BodyCompositionMethod,
  VO2MAX_METHODS,
  Vo2maxDraft,
  Vo2maxMethod,
} from '@/types/assessment';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NOTES_LIMIT = 1000;

const HEIGHT_RANGE = { min: 50, max: 250, decimals: 1 };
const MASS_RANGE = { min: 20, max: 300, decimals: 1 };
const FAT_PERCENT_RANGE = { min: 1, max: 70, decimals: 1 };
const COMPONENT_MASS_RANGE = { min: 0, max: 250, decimals: 1 };
const VO2_RELATIVE_RANGE = { min: 10, max: 100, decimals: 1 };
const VO2_ABSOLUTE_RANGE = { min: 0.5, max: 10, decimals: 2 };
const HEART_RATE_RANGE = { min: 40, max: 230 };

export function assessmentDocId(kind: AssessmentKind, date: string): string {
  return `${kind}_${date}`;
}

export function createBodyCompositionDraft(date: string): BodyCompositionDraft {
  return {
    date,
    method: 'scale',
    heightCm: '',
    bodyMassKg: '',
    bodyFatPercent: '',
    fatMassKg: '',
    leanMassKg: '',
    notes: '',
  };
}

export function createVo2maxDraft(date: string): Vo2maxDraft {
  return {
    date,
    method: 'lab_treadmill',
    vo2maxMlKgMin: '',
    vo2maxLMin: '',
    maxHeartRate: '',
    notes: '',
  };
}

export function bodyDraftFromLog(log: AssessmentLog): BodyCompositionDraft {
  return {
    date: log.date,
    method: isBodyMethod(log.method) ? log.method : 'other',
    heightCm: formatStoredNumber(log.heightCm),
    bodyMassKg: formatStoredNumber(log.bodyMassKg),
    bodyFatPercent: formatStoredNumber(log.bodyFatPercent),
    fatMassKg: formatStoredNumber(log.fatMassKg),
    leanMassKg: formatStoredNumber(log.leanMassKg),
    notes: log.notes ?? '',
  };
}

export function vo2DraftFromLog(log: AssessmentLog): Vo2maxDraft {
  return {
    date: log.date,
    method: isVo2Method(log.method) ? log.method : 'other',
    vo2maxMlKgMin: formatStoredNumber(log.vo2maxMlKgMin),
    vo2maxLMin: formatStoredNumber(log.vo2maxLMin),
    maxHeartRate: formatStoredNumber(log.maxHeartRate),
    notes: log.notes ?? '',
  };
}

export function assessmentMethodLabel(kind: AssessmentKind, method: string): string {
  const options = kind === 'body_composition' ? BODY_COMPOSITION_METHODS : VO2MAX_METHODS;
  return options.find((option) => option.value === method)?.label ?? method;
}

export function formatAssessmentDate(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatAssessmentDetail(log: AssessmentLog): string {
  const method = assessmentMethodLabel(log.kind, log.method);
  if (log.kind === 'body_composition') {
    const parts = [method];
    if (log.heightCm !== undefined) parts.push(`${formatStoredNumber(log.heightCm)} cm`);
    if (log.bodyMassKg !== undefined) parts.push(`${formatStoredNumber(log.bodyMassKg)} kg`);
    if (log.bodyFatPercent !== undefined) parts.push(`${formatStoredNumber(log.bodyFatPercent)}%`);
    return parts.join(' · ');
  }

  const parts = [method];
  if (log.vo2maxMlKgMin !== undefined) parts.push(`${formatStoredNumber(log.vo2maxMlKgMin)} ml/kg/min`);
  if (log.vo2maxLMin !== undefined) parts.push(`${formatStoredNumber(log.vo2maxLMin)} L/min`);
  return parts.join(' · ');
}

export function calculateBmi(heightCm: number, bodyMassKg: number): number | null {
  if (
    heightCm < HEIGHT_RANGE.min ||
    heightCm > HEIGHT_RANGE.max ||
    bodyMassKg < MASS_RANGE.min ||
    bodyMassKg > MASS_RANGE.max
  ) {
    return null;
  }

  const meters = heightCm / 100;
  return Math.round((bodyMassKg / (meters * meters)) * 10) / 10;
}

export function previewBmi(heightRaw: string, massRaw: string): number | null {
  const height = parseLooseNumber(heightRaw);
  const mass = parseLooseNumber(massRaw);
  if (height === null || mass === null) return null;
  return calculateBmi(height, mass);
}

export function parseBodyComposition(
  draft: BodyCompositionDraft,
  todayKey: string
): { ok: true; value: AssessmentWrite } | { ok: false; message: string } {
  const dateError = dateErrorMessage(draft.date, todayKey);
  if (dateError) return { ok: false, message: dateError };
  if (!isBodyMethod(draft.method)) return { ok: false, message: 'Choose a method.' };

  const notes = parseNotes(draft.notes);
  if (typeof notes !== 'string' && notes !== undefined) return notes;

  const heightCm = parseDecimal(draft.heightCm, 'Height', HEIGHT_RANGE.min, HEIGHT_RANGE.max, HEIGHT_RANGE.decimals);
  const bodyMassKg = parseDecimal(draft.bodyMassKg, 'Body mass', MASS_RANGE.min, MASS_RANGE.max, MASS_RANGE.decimals);
  const bodyFatPercent = parseDecimal(draft.bodyFatPercent, 'Body fat', FAT_PERCENT_RANGE.min, FAT_PERCENT_RANGE.max, FAT_PERCENT_RANGE.decimals);
  const fatMassKg = parseDecimal(draft.fatMassKg, 'Fat mass', COMPONENT_MASS_RANGE.min, COMPONENT_MASS_RANGE.max, COMPONENT_MASS_RANGE.decimals);
  const leanMassKg = parseDecimal(draft.leanMassKg, 'Lean mass', COMPONENT_MASS_RANGE.min, COMPONENT_MASS_RANGE.max, COMPONENT_MASS_RANGE.decimals);

  const parsed = [heightCm, bodyMassKg, bodyFatPercent, fatMassKg, leanMassKg];
  const invalid = parsed.find((value) => value !== undefined && typeof value !== 'number');
  if (invalid && typeof invalid !== 'number') return invalid;

  if (!parsed.some((value) => typeof value === 'number')) {
    return { ok: false, message: 'Enter a height, body mass, body fat, fat mass, or lean mass.' };
  }

  return {
    ok: true,
    value: {
      kind: 'body_composition',
      date: draft.date,
      method: draft.method,
      notes,
      heightCm: asNumber(heightCm),
      bodyMassKg: asNumber(bodyMassKg),
      bodyFatPercent: asNumber(bodyFatPercent),
      fatMassKg: asNumber(fatMassKg),
      leanMassKg: asNumber(leanMassKg),
    },
  };
}

export function parseVo2max(
  draft: Vo2maxDraft,
  todayKey: string
): { ok: true; value: AssessmentWrite } | { ok: false; message: string } {
  const dateError = dateErrorMessage(draft.date, todayKey);
  if (dateError) return { ok: false, message: dateError };
  if (!isVo2Method(draft.method)) return { ok: false, message: 'Choose a method.' };

  const notes = parseNotes(draft.notes);
  if (typeof notes !== 'string' && notes !== undefined) return notes;

  const vo2maxMlKgMin = parseDecimal(
    draft.vo2maxMlKgMin,
    'VO2max',
    VO2_RELATIVE_RANGE.min,
    VO2_RELATIVE_RANGE.max,
    VO2_RELATIVE_RANGE.decimals
  );
  const vo2maxLMin = parseDecimal(
    draft.vo2maxLMin,
    'Absolute VO2',
    VO2_ABSOLUTE_RANGE.min,
    VO2_ABSOLUTE_RANGE.max,
    VO2_ABSOLUTE_RANGE.decimals
  );
  const maxHeartRate = parseInteger(draft.maxHeartRate, 'Max heart rate', HEART_RATE_RANGE.min, HEART_RATE_RANGE.max);

  const invalid = [vo2maxMlKgMin, vo2maxLMin, maxHeartRate].find(
    (value) => value !== undefined && typeof value !== 'number'
  );
  if (invalid && typeof invalid !== 'number') return invalid;
  if (typeof vo2maxMlKgMin !== 'number') return { ok: false, message: 'Enter a VO2max.' };

  return {
    ok: true,
    value: {
      kind: 'vo2max',
      date: draft.date,
      method: draft.method,
      notes,
      vo2maxMlKgMin,
      vo2maxLMin: asNumber(vo2maxLMin),
      maxHeartRate: asNumber(maxHeartRate),
    },
  };
}

export function assessmentWriteError(fields: AssessmentWrite, todayKey: string): string | null {
  if (fields.kind === 'body_composition') {
    if (!isBodyMethod(fields.method)) return 'Choose a method.';
    const parsed = parseBodyComposition({
      date: fields.date,
      method: fields.method,
      heightCm: formatStoredNumber(fields.heightCm),
      bodyMassKg: formatStoredNumber(fields.bodyMassKg),
      bodyFatPercent: formatStoredNumber(fields.bodyFatPercent),
      fatMassKg: formatStoredNumber(fields.fatMassKg),
      leanMassKg: formatStoredNumber(fields.leanMassKg),
      notes: fields.notes ?? '',
    }, todayKey);
    return parsed.ok ? null : parsed.message;
  }

  if (!isVo2Method(fields.method)) return 'Choose a method.';
  const parsed = parseVo2max({
    date: fields.date,
    method: fields.method,
    vo2maxMlKgMin: formatStoredNumber(fields.vo2maxMlKgMin),
    vo2maxLMin: formatStoredNumber(fields.vo2maxLMin),
    maxHeartRate: formatStoredNumber(fields.maxHeartRate),
    notes: fields.notes ?? '',
  }, todayKey);
  return parsed.ok ? null : parsed.message;
}

function isBodyMethod(method: string): method is BodyCompositionMethod {
  return BODY_COMPOSITION_METHODS.some((option) => option.value === method);
}

function isVo2Method(method: string): method is Vo2maxMethod {
  return VO2MAX_METHODS.some((option) => option.value === method);
}

function formatStoredNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function asNumber(value: number | { ok: false; message: string } | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function dateErrorMessage(date: string, todayKey: string): string | null {
  if (!DATE_KEY_PATTERN.test(date)) return 'Enter a valid date.';
  const parsed = dateKeyToLocalDate(date);
  if (!parsed || toLocalDateString(parsed) !== date) return 'Enter a valid date.';
  if (date > todayKey) return "Can't log a test for a future date.";
  return null;
}

function parseNotes(notes: string): string | undefined | { ok: false; message: string } {
  const trimmed = notes.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > NOTES_LIMIT) return { ok: false, message: 'Notes must be 1000 characters or fewer.' };
  return trimmed;
}

function parseLooseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function parseDecimal(
  raw: string,
  label: string,
  min: number,
  max: number,
  decimals: number
): number | undefined | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = parseLooseNumber(trimmed);
  if (value === null || value < min || value > max) {
    return { ok: false, message: `${label} must be between ${min} and ${max}.` };
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function parseInteger(
  raw: string,
  label: string,
  min: number,
  max: number
): number | undefined | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = parseLooseNumber(trimmed);
  if (value === null || !Number.isInteger(value)) {
    return { ok: false, message: `${label} must be a whole number.` };
  }
  if (value < min || value > max) {
    return { ok: false, message: `${label} must be between ${min} and ${max}.` };
  }
  return value;
}
