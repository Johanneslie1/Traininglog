import { Program } from '@/types/program';
import { auth } from '@/services/firebase/config';
import { createProgram, getPrograms, replaceProgram } from '@/services/programService';
import {
  SPEED_STRENGTH_BLOCK_1_NAME,
  buildSpeedStrengthBlock1Program,
  isCurrentSpeedStrengthBlock1Revision,
  isSpeedStrengthBlock1Program,
} from '@/data/programs/speedStrengthBlock1';
import {
  HELES_TRAINING_PROGRAM_NAME,
  buildHelesTrainingProgram,
  isCurrentHelesTrainingProgramRevision,
  isHelesTrainingProgram,
} from '@/data/programs/helesTrainingProgram';
import { logger } from '@/utils/logger';

type StarterSeedResult = { created: boolean; updated: boolean; programId?: string };

const findNamedProgram = (
  programs: Program[],
  name: string,
  isMatch: (program: Pick<Program, 'name' | 'tags'>) => boolean
): Program | undefined =>
  programs.find((program) => program.name === name) ??
  programs.find((program) => isMatch(program) && !program.name.includes('(Copy)'));

const seedProgram = async (
  programs: Program[],
  options: {
    label: string;
    find: (programs: Program[]) => Program | undefined;
    isCurrent: (program: Pick<Program, 'name' | 'tags'>) => boolean;
    build: (userId: string) => Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;
  }
): Promise<StarterSeedResult> => {
  const user = auth.currentUser;
  if (!user?.uid) {
    return { created: false, updated: false };
  }

  const existing = options.find(programs);
  if (!existing) {
    logger.debug(`[starterProgramService] Creating ${options.label}`);
    const programId = await createProgram(options.build(user.uid));
    return { created: true, updated: false, programId };
  }

  if (options.isCurrent(existing)) {
    return { created: false, updated: false, programId: existing.id };
  }

  logger.debug(`[starterProgramService] Updating ${options.label} to current revision`);
  const nextProgram = options.build(user.uid);
  await replaceProgram(existing.id, {
    ...nextProgram,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: existing.updatedAt,
  });
  return { created: false, updated: true, programId: existing.id };
};

export const findSpeedStrengthBlock1Program = (programs: Program[]): Program | undefined =>
  findNamedProgram(programs, SPEED_STRENGTH_BLOCK_1_NAME, isSpeedStrengthBlock1Program);

export const findHelesTrainingProgram = (programs: Program[]): Program | undefined =>
  findNamedProgram(programs, HELES_TRAINING_PROGRAM_NAME, isHelesTrainingProgram);

export const createSpeedStrengthBlock1Program = async (userId: string): Promise<string> =>
  createProgram(buildSpeedStrengthBlock1Program(userId));

export const createHelesTrainingProgram = async (userId: string): Promise<string> =>
  createProgram(buildHelesTrainingProgram(userId));

export const ensureSpeedStrengthBlock1Program = async (
  existingPrograms?: Program[]
): Promise<StarterSeedResult> => {
  const programs = existingPrograms ?? await getPrograms();
  return seedProgram(programs, {
    label: 'Speed + Strength Blokk 1',
    find: findSpeedStrengthBlock1Program,
    isCurrent: isCurrentSpeedStrengthBlock1Revision,
    build: buildSpeedStrengthBlock1Program,
  });
};

export const ensureHelesTrainingProgram = async (
  existingPrograms?: Program[]
): Promise<StarterSeedResult> => {
  const programs = existingPrograms ?? await getPrograms();
  return seedProgram(programs, {
    label: "Hele's Training Program",
    find: findHelesTrainingProgram,
    isCurrent: isCurrentHelesTrainingProgramRevision,
    build: buildHelesTrainingProgram,
  });
};

export const ensureStarterPrograms = async (
  existingPrograms?: Program[]
): Promise<StarterSeedResult> => {
  let programs = existingPrograms ?? await getPrograms();
  const speedStrength = await ensureSpeedStrengthBlock1Program(programs);
  if (speedStrength.created || speedStrength.updated) {
    programs = await getPrograms();
  }

  const heles = await ensureHelesTrainingProgram(programs);
  return {
    created: speedStrength.created || heles.created,
    updated: speedStrength.updated || heles.updated,
    programId: heles.programId ?? speedStrength.programId,
  };
};
