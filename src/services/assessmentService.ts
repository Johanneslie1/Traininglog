import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  deleteField,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { AssessmentKind, AssessmentLog, AssessmentWrite } from '@/types/assessment';
import { getDateEpochDay, toLocalDateString } from '@/utils/dateUtils';
import { assessmentDocId, assessmentWriteError } from '@/utils/assessmentLog';

const BODY_METRIC_KEYS = ['heightCm', 'bodyMassKg', 'bodyFatPercent', 'fatMassKg', 'leanMassKg'] as const;
const VO2_METRIC_KEYS = ['vo2maxMlKgMin', 'vo2maxLMin', 'maxHeartRate'] as const;

function ensureAuth(): string {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
}

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function metricKeys(kind: AssessmentKind): readonly (keyof AssessmentWrite)[] {
  return kind === 'body_composition' ? BODY_METRIC_KEYS : VO2_METRIC_KEYS;
}

export async function listAssessments(
  userId: string,
  kind: AssessmentKind
): Promise<AssessmentLog[]> {
  const ref = collection(db, 'users', userId, 'assessments');
  const snap = await getDocs(query(ref, where('kind', '==', kind)));
  return snap.docs
    .map((entry) => ({
      id: entry.id,
      ...(entry.data() as Omit<AssessmentLog, 'id'>),
    }))
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function saveAssessment(
  fields: AssessmentWrite,
  previousId?: string
): Promise<string> {
  const message = assessmentWriteError(fields, toLocalDateString(new Date()));
  if (message) throw new Error(message);

  const userId = ensureAuth();
  const id = assessmentDocId(fields.kind, fields.date);
  const ref = doc(db, 'users', userId, 'assessments', id);
  const dateEpochDay = getDateEpochDay(fields.date, 'assessment date');
  const payload = removeUndefined({
    userId,
    date: fields.date,
    dateEpochDay,
    kind: fields.kind,
    method: fields.method,
    notes: fields.notes,
    heightCm: fields.heightCm,
    bodyMassKg: fields.bodyMassKg,
    bodyFatPercent: fields.bodyFatPercent,
    fatMassKg: fields.fatMassKg,
    leanMassKg: fields.leanMassKg,
    vo2maxMlKgMin: fields.vo2maxMlKgMin,
    vo2maxLMin: fields.vo2maxLMin,
    maxHeartRate: fields.maxHeartRate,
  });

  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, { ...payload, timestamp: serverTimestamp() });
  } else {
    const updatePayload: Record<string, unknown> = {
      userId,
      date: fields.date,
      dateEpochDay,
      kind: fields.kind,
      method: fields.method,
      timestamp: serverTimestamp(),
      notes: fields.notes === undefined ? deleteField() : fields.notes,
    };

    metricKeys(fields.kind).forEach((key) => {
      updatePayload[key] = fields[key] === undefined ? deleteField() : fields[key];
    });

    await updateDoc(ref, updatePayload as UpdateData<DocumentData>);
  }

  if (previousId && previousId !== id) {
    await deleteDoc(doc(db, 'users', userId, 'assessments', previousId));
  }

  return id;
}

export async function deleteAssessment(id: string): Promise<void> {
  const userId = ensureAuth();
  await deleteDoc(doc(db, 'users', userId, 'assessments', id));
}
