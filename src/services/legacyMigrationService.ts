import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type UpdateData,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { normalizeActivityType } from '@/types/activityLog';
import { ActivityType } from '@/types/activityTypes';
import { normalizeEnduranceDurationMinutes } from '@/utils/prescriptionUtils';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';

const BATCH_LIMIT = 450;

export interface LegacyMigrationSummary {
  userId: string;
  activitiesUpdated: number;
  exerciseLogsUpdated: number;
  programSessionsUpdated: number;
  exercisesUpdatedInPrograms: number;
}

type WriteOperation = {
  ref: DocumentReference<DocumentData>;
  data: UpdateData<DocumentData>;
};

const areEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const commitOperations = async (operations: WriteOperation[]): Promise<void> => {
  if (operations.length === 0) return;

  const chunks = chunkArray(operations, BATCH_LIMIT);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((operation) => {
      batch.update(operation.ref, operation.data);
    });
    await batch.commit();
  }
};

const normalizeProgramExercise = (exercise: any) => {
  const normalized = { ...exercise };
  let changed = false;

  const resolvedType = resolveActivityTypeFromExerciseLike(exercise, { fallback: ActivityType.RESISTANCE });
  if (resolvedType !== exercise.activityType) {
    normalized.activityType = resolvedType;
    changed = true;
  }

  const effectiveActivityType: ActivityType | undefined = normalized.activityType
    ? normalizeActivityType(normalized.activityType)
    : undefined;

  if (
    normalized.prescription &&
    effectiveActivityType &&
    (effectiveActivityType === ActivityType.ENDURANCE || effectiveActivityType === ActivityType.SPORT)
  ) {
    const originalDuration = normalized.prescription.duration;
    const normalizedDuration = normalizeEnduranceDurationMinutes(originalDuration);

    if (!areEqual(originalDuration, normalizedDuration)) {
      normalized.prescription = {
        ...normalized.prescription,
        duration: normalizedDuration,
      };
      changed = true;
    }
  }

  return { normalized, changed };
};

const toDocRef = (snapshot: QueryDocumentSnapshot<DocumentData>): DocumentReference<DocumentData> =>
  doc(snapshot.ref.firestore, snapshot.ref.path);

export const migrateLegacyDataForUser = async (userId: string): Promise<LegacyMigrationSummary> => {
  const summary: LegacyMigrationSummary = {
    userId,
    activitiesUpdated: 0,
    exerciseLogsUpdated: 0,
    programSessionsUpdated: 0,
    exercisesUpdatedInPrograms: 0,
  };

  const operations: WriteOperation[] = [];

  const activitiesSnapshot = await getDocs(collection(db, 'users', userId, 'activities'));
  activitiesSnapshot.docs.forEach((activityDoc) => {
    const data = activityDoc.data();
    const normalizedType = normalizeActivityType(data.activityType);

    if (normalizedType !== data.activityType) {
      operations.push({
        ref: toDocRef(activityDoc),
        data: {
          activityType: normalizedType,
          updatedAt: serverTimestamp(),
        },
      });
      summary.activitiesUpdated += 1;
    }
  });

  const exerciseLogsSnapshot = await getDocs(collection(db, 'users', userId, 'exercises'));
  exerciseLogsSnapshot.docs.forEach((exerciseLogDoc) => {
    const data = exerciseLogDoc.data();

    const resolvedType = resolveActivityTypeFromExerciseLike(
      {
        name: data.name,
        exerciseName: data.name,
        activityType: data.activityType,
        type: data.exerciseType,
        exerciseType: data.exerciseType,
        sets: Array.isArray(data.sets) ? data.sets : [],
      },
      {
        fallback: ActivityType.RESISTANCE,
        preferHintOverExplicit: true,
        preferHintOverOther: true,
        preferSpeedAgilityNameHintOverResistance: true,
      }
    );

    const normalizedType = normalizeActivityType(resolvedType);
    if (normalizedType !== data.activityType) {
      operations.push({
        ref: toDocRef(exerciseLogDoc),
        data: {
          activityType: normalizedType,
          updatedAt: serverTimestamp(),
        },
      });
      summary.exerciseLogsUpdated += 1;
    }
  });

  const programsRef = collection(db, 'programs');
  const programsSnapshot = await getDocs(query(programsRef, where('userId', '==', userId)));

  for (const programDoc of programsSnapshot.docs) {
    const sessionsSnapshot = await getDocs(collection(db, 'programs', programDoc.id, 'sessions'));

    sessionsSnapshot.docs.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data();
      const originalExercises = Array.isArray(sessionData.exercises) ? sessionData.exercises : [];

      let sessionChanged = false;
      let changedExerciseCount = 0;

      const normalizedExercises = originalExercises.map((exercise: any) => {
        const { normalized, changed } = normalizeProgramExercise(exercise);
        if (changed) {
          sessionChanged = true;
          changedExerciseCount += 1;
        }
        return normalized;
      });

      if (sessionChanged) {
        operations.push({
          ref: toDocRef(sessionDoc),
          data: {
            exercises: normalizedExercises,
            updatedAt: serverTimestamp(),
          },
        });
        summary.programSessionsUpdated += 1;
        summary.exercisesUpdatedInPrograms += changedExerciseCount;
      }
    });
  }

  await commitOperations(operations);

  return summary;
};

export const migrateLegacyDataForCurrentUser = async (): Promise<LegacyMigrationSummary> => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error('User must be logged in to run legacy data migration');
  }

  return migrateLegacyDataForUser(userId);
};
