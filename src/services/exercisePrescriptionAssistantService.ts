import { Exercise, ExercisePrescriptionAssistantData } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { SuggestedPrescriptionSet } from '@/types/sets';
import { NumberOrRange, Prescription } from '@/types/program';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

interface AssistantHistoryEntry {
  date: string;
  reps?: number;
  load?: number;
  rpe?: number;
  duration?: number;
  distance?: number;
}

interface AssistantUserContext {
  recentHistory?: AssistantHistoryEntry[];
  oneRepMax?: number;
  typicalRPE?: number;
  trainingPhase?: string;
  goals?: string[];
}

interface AssistantSessionContext {
  date: string;
  warmupDone: boolean;
}

interface AssistantInput {
  exercise: Pick<Exercise, 'id' | 'name' | 'activityType' | 'prescription'>;
  userContext: AssistantUserContext;
  sessionContext: AssistantSessionContext;
}

interface AssistantGenerateParams {
  exercise: Pick<Exercise, 'id' | 'name' | 'activityType' | 'prescription'>;
  userId?: string;
  userContext?: Partial<AssistantUserContext>;
  sessionContext?: Partial<AssistantSessionContext>;
}

const DEFAULT_REST_SECONDS = 120;
const OPENAI_BASE_URL = import.meta.env.VITE_PRESCRIPTION_LLM_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = import.meta.env.VITE_PRESCRIPTION_LLM_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = import.meta.env.VITE_PRESCRIPTION_LLM_API_KEY;

const SYSTEM_PROMPT = `You are the Exercise Prescription Assistant for TrainingLog.
Input includes exercise (id,name,activityType,prescription), userContext (recentHistory, oneRepMax, typicalRPE, trainingPhase, goals), and sessionContext (date,warmupDone).
Return strict JSON with keys:
- uiHint: max 120 chars.
- suggestedPrescription: ordered array of sets with keys setIndex, targetReps, targetLoad, targetRPE, targetDuration, targetDistance, restSec, editable, confidence.
- progressionNote: one line.
- warnings: array of short strings.
- alternatives: array of short strings.
Rules:
- Prefer exercise.prescription when present and adapt using recentHistory.
- If range given, choose higher targets when warmupDone and fatigue low; choose lower when fatigue high.
- Convert percentage intensity to kg when oneRepMax known and round to nearest 0.5 kg.
- For non-resistance activityType, prioritize duration/distance over load.
- Include warnings and alternatives when key data missing.
- Keep output compact and parseable JSON only.`;

const parseRangeValue = (value?: NumberOrRange): { min: number; max: number } | null => {
  if (typeof value === 'number') {
    return { min: value, max: value };
  }

  if (value && typeof value === 'object' && typeof value.min === 'number' && typeof value.max === 'number') {
    return { min: value.min, max: value.max };
  }

  return null;
};

const pickByFatigue = (range: { min: number; max: number }, highFatigue: boolean): number => {
  if (range.min === range.max) {
    return range.min;
  }

  return highFatigue ? range.min : range.max;
};

const clampConfidence = (value: number): number => {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 100) / 100;
};

const roundToHalfKg = (value: number): number => Math.round(value * 2) / 2;

const estimateOneRepMax = (recentHistory: AssistantHistoryEntry[]): number | undefined => {
  const best = recentHistory.find((entry) => typeof entry.load === 'number' && typeof entry.reps === 'number' && entry.load > 0 && entry.reps > 0);
  if (!best || !best.load || !best.reps) {
    return undefined;
  }

  const estimated = best.load * (1 + best.reps / 30);
  return roundToHalfKg(estimated);
};

const buildUiHint = (
  setsLabel: string,
  repsTarget: string | null,
  loadTarget: string | null,
  rpeTarget: number | null,
  restSec: number,
  activityType: ActivityType
): string => {
  const setPart = setsLabel;

  if (activityType !== ActivityType.RESISTANCE) {
    const pieces = [setPart, repsTarget, loadTarget].filter(Boolean).join(' • ');
    return pieces.slice(0, 120);
  }

  const repsPart = repsTarget ? `× ${repsTarget}` : '';
  const loadPart = loadTarget ? `~${loadTarget}` : null;
  const rpePart = typeof rpeTarget === 'number' ? `RPE ${rpeTarget}` : null;
  const hint = [setPart + (repsPart ? ` ${repsPart}` : ''), loadPart, rpePart, `rest ${restSec}s`].filter(Boolean).join(' • ');
  return hint.slice(0, 120);
};

const getFallbackLoad = (
  prescription: Prescription | undefined,
  oneRepMax: number | undefined,
  warnings: string[],
  alternatives: string[]
): { targetLoad?: string; targetRPE?: number } => {
  if (!prescription) {
    return {};
  }

  if (typeof prescription.rpe === 'number') {
    return { targetRPE: prescription.rpe };
  }

  if (!prescription.weight) {
    return {};
  }

  const weightRange = parseRangeValue(prescription.weight.value);
  const weightValue = weightRange ? (weightRange.min + weightRange.max) / 2 : undefined;

  if (prescription.weight.type === 'absolute' && typeof weightValue === 'number') {
    return { targetLoad: `${roundToHalfKg(weightValue)} kg` };
  }

  if (prescription.weight.type === 'rpe' && typeof weightValue === 'number') {
    return { targetRPE: Math.round(weightValue * 10) / 10 };
  }

  if (prescription.weight.type === 'percentage' && typeof weightValue === 'number') {
    if (typeof oneRepMax !== 'number' || oneRepMax <= 0) {
      warnings.push('No 1RM available for percentage load.');
      alternatives.push('Use target RPE 7.5-8 instead.');
      return { targetRPE: 7.5 };
    }

    const ratio = weightValue > 1 ? weightValue / 100 : weightValue;
    const kg = roundToHalfKg(oneRepMax * ratio);
    return { targetLoad: `${kg} kg` };
  }

  return {};
};

const inferFatigue = (recentHistory: AssistantHistoryEntry[], warmupDone: boolean): boolean => {
  if (!warmupDone) {
    return true;
  }

  const recentRpe = recentHistory
    .map((entry) => entry.rpe)
    .filter((value): value is number => typeof value === 'number');

  if (recentRpe.length === 0) {
    return false;
  }

  const avgRpe = recentRpe.reduce((sum, value) => sum + value, 0) / recentRpe.length;
  return avgRpe >= 8.8;
};

const buildFallbackSuggestion = (input: AssistantInput): ExercisePrescriptionAssistantData => {
  const activityType = input.exercise.activityType || ActivityType.RESISTANCE;
  const prescription = input.exercise.prescription;
  const recentHistory = input.userContext.recentHistory || [];
  const warnings: string[] = [];
  const alternatives: string[] = [];

  const highFatigue = inferFatigue(recentHistory, input.sessionContext.warmupDone);
  const setsRange = parseRangeValue(prescription?.sets) || { min: 3, max: 3 };
  const setsCount = Math.max(1, Math.round(pickByFatigue(setsRange, false)));
  const setsLabel = setsRange.min === setsRange.max
    ? `${setsCount} set${setsCount === 1 ? '' : 's'}`
    : `${setsRange.min}-${setsRange.max} sets`;
  const restSec = prescription?.rest ?? DEFAULT_REST_SECONDS;

  const repsRange = parseRangeValue(prescription?.reps);
  const durationRange = parseRangeValue(prescription?.duration);
  const distanceRange = parseRangeValue(prescription?.distance);

  const oneRepMax = input.userContext.oneRepMax ?? estimateOneRepMax(recentHistory);
  const { targetLoad, targetRPE } = getFallbackLoad(prescription, oneRepMax, warnings, alternatives);

  const baseConfidence = clampConfidence(
    0.92 -
      (prescription ? 0 : 0.15) -
      (recentHistory.length > 0 ? 0 : 0.1) -
      (warnings.length > 0 ? 0.08 : 0)
  );

  const suggestedPrescription: SuggestedPrescriptionSet[] = Array.from({ length: setsCount }).map((_, index) => {
    const setIndex = index + 1;
    const setReps = repsRange ? pickByFatigue(repsRange, highFatigue || setIndex > Math.ceil(setsCount / 2)) : undefined;
    const setDuration = durationRange ? pickByFatigue(durationRange, highFatigue) : undefined;
    const setDistance = distanceRange ? pickByFatigue(distanceRange, highFatigue) : undefined;

    const suggestion: SuggestedPrescriptionSet = {
      setIndex,
      editable: true,
      confidence: clampConfidence(baseConfidence - (index >= Math.ceil(setsCount * 0.75) ? 0.05 : 0)),
      restSec,
    };

    if (activityType === ActivityType.RESISTANCE) {
      suggestion.targetReps = setReps;
      suggestion.targetLoad = targetLoad;
      suggestion.targetRPE = targetRPE;
    } else {
      if (typeof setDuration === 'number') suggestion.targetDuration = setDuration;
      if (typeof setDistance === 'number') suggestion.targetDistance = setDistance;
      if (typeof setReps === 'number') suggestion.targetReps = setReps;
      if (typeof targetRPE === 'number') suggestion.targetRPE = targetRPE;
    }

    return suggestion;
  });

  if (!prescription) {
    warnings.push('No structured prescription found.');
    alternatives.push('Use recent best session as starting target.');
  }

  const repsHint = repsRange ? `${repsRange.min}-${repsRange.max} reps` : null;
  const nonResistanceHint = activityType === ActivityType.RESISTANCE
    ? null
    : [
        durationRange ? `${durationRange.min}-${durationRange.max} min` : null,
        distanceRange ? `${distanceRange.min}-${distanceRange.max} km` : null,
      ].filter(Boolean).join(' • ');

  const uiHint = buildUiHint(
    setsLabel,
    repsHint,
    activityType === ActivityType.RESISTANCE ? targetLoad || null : nonResistanceHint || null,
    targetRPE ?? null,
    restSec,
    activityType
  );

  const progressionNote = recentHistory.length > 0
    ? 'When top-range reps are consistent across sets with clean form, increase load by roughly 1-2.5% next session.'
    : 'Build consistency first, then nudge load up by about 1-2.5% once top-range reps feel stable.';

  return {
    uiHint,
    suggestedPrescription,
    progressionNote,
    warnings,
    alternatives,
    source: 'fallback',
    generatedAt: new Date().toISOString(),
  };
};

const extractJsonObject = (raw: string): string => {
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return raw.trim();
};

const normalizeAssistantOutput = (candidate: Partial<ExercisePrescriptionAssistantData>): ExercisePrescriptionAssistantData | null => {
  if (!candidate || typeof candidate.uiHint !== 'string' || !Array.isArray(candidate.suggestedPrescription)) {
    return null;
  }

  const normalizedSets: SuggestedPrescriptionSet[] = candidate.suggestedPrescription
    .map((set) => ({
      setIndex: typeof set.setIndex === 'number' ? set.setIndex : 0,
      targetReps: typeof set.targetReps === 'number' ? set.targetReps : undefined,
      targetLoad: typeof set.targetLoad === 'string' ? set.targetLoad : undefined,
      targetRPE: typeof set.targetRPE === 'number' ? set.targetRPE : undefined,
      targetDuration: typeof set.targetDuration === 'number' ? set.targetDuration : undefined,
      targetDistance: typeof set.targetDistance === 'number' ? set.targetDistance : undefined,
      restSec: typeof set.restSec === 'number' ? set.restSec : undefined,
      editable: typeof set.editable === 'boolean' ? set.editable : true,
      confidence: clampConfidence(typeof set.confidence === 'number' ? set.confidence : 0.65),
    }))
    .filter((set) => set.setIndex > 0);

  if (normalizedSets.length === 0) {
    return null;
  }

  return {
    uiHint: candidate.uiHint.slice(0, 120),
    suggestedPrescription: normalizedSets,
    progressionNote: typeof candidate.progressionNote === 'string'
      ? candidate.progressionNote.replace(/0\s*-\s*1\s*rep/gi, '1 rep').replace(/0\s*to\s*1\s*rep/gi, '1 rep')
      : 'When top-range reps are consistent, increase load by a small step (around 1-2.5%).',
    warnings: Array.isArray(candidate.warnings) ? candidate.warnings.filter((item): item is string => typeof item === 'string') : [],
    alternatives: Array.isArray(candidate.alternatives) ? candidate.alternatives.filter((item): item is string => typeof item === 'string') : [],
    source: 'llm',
    generatedAt: new Date().toISOString(),
  };
};

const tryGenerateViaLlm = async (input: AssistantInput): Promise<ExercisePrescriptionAssistantData | null> => {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const rawContent: string | undefined = payload?.choices?.[0]?.message?.content;

  if (!rawContent) {
    return null;
  }

  const parsed = JSON.parse(extractJsonObject(rawContent));
  return normalizeAssistantOutput(parsed);
};

const buildHistoryEntryFromSets = (sets: Array<Record<string, unknown>>, date: string): AssistantHistoryEntry => {
  const firstSet = sets[0] || {};

  const entry: AssistantHistoryEntry = { date };

  if (typeof firstSet.reps === 'number') entry.reps = firstSet.reps;
  if (typeof firstSet.weight === 'number') entry.load = firstSet.weight;
  if (typeof firstSet.rpe === 'number') entry.rpe = firstSet.rpe;
  if (typeof firstSet.duration === 'number') entry.duration = firstSet.duration;
  if (typeof firstSet.distance === 'number') entry.distance = firstSet.distance;

  return entry;
};

const fetchRecentHistory = async (userId: string, exerciseName: string): Promise<AssistantHistoryEntry[]> => {
  try {
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const historyQuery = query(
      exercisesRef,
      where('exerciseName', '==', exerciseName)
    );

    const snapshot = await getDocs(historyQuery);
    return snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const sets = Array.isArray(data.sets) ? (data.sets as Array<Record<string, unknown>>) : [];
        const timestamp = data.timestamp?.toDate?.() instanceof Date
          ? data.timestamp.toDate() as Date
          : new Date(0);
        const date = timestamp.getTime() > 0
          ? timestamp.toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        return {
          entry: buildHistoryEntryFromSets(sets, date),
          timestamp,
        };
      })
      .filter((item) => Object.keys(item.entry).length > 1)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map((item) => item.entry);
  } catch (error) {
    console.warn('Assistant history fetch failed, continuing without history:', error);
    return [];
  }
};

export const generateExercisePrescriptionAssistant = async (
  params: AssistantGenerateParams
): Promise<ExercisePrescriptionAssistantData> => {
  const activityType = params.exercise.activityType || ActivityType.RESISTANCE;
  const sessionDate = params.sessionContext?.date || new Date().toISOString().slice(0, 10);

  const recentHistory = params.userContext?.recentHistory
    ? [...params.userContext.recentHistory]
    : params.userId
      ? await fetchRecentHistory(params.userId, params.exercise.name)
      : [];

  const input: AssistantInput = {
    exercise: {
      ...params.exercise,
      activityType,
    },
    userContext: {
      recentHistory,
      oneRepMax: params.userContext?.oneRepMax,
      typicalRPE: params.userContext?.typicalRPE,
      trainingPhase: params.userContext?.trainingPhase,
      goals: params.userContext?.goals,
    },
    sessionContext: {
      date: sessionDate,
      warmupDone: params.sessionContext?.warmupDone ?? true,
    },
  };

  try {
    const llmOutput = await tryGenerateViaLlm(input);
    if (llmOutput) {
      return llmOutput;
    }
  } catch (error) {
    console.warn('Prescription assistant LLM failed, using fallback:', error);
  }

  return buildFallbackSuggestion(input);
};
