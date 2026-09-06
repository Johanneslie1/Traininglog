import { Program } from '@/types/program';
import { auth } from '@/services/firebase/config';
import { createProgram, getPrograms, replaceProgram } from '@/services/programService';
import {
  SPEED_STRENGTH_BLOCK_1_NAME,
  buildSpeedStrengthBlock1Program,
  isCurrentSpeedStrengthBlock1Revision,
  isSpeedStrengthBlock1Program,
} from '@/data/programs/speedStrengthBlock1';
import { logger } from '@/utils/logger';

export const findSpeedStrengthBlock1Program = (programs: Program[]): Program | undefined =>
  programs.find((program) => program.name === SPEED_STRENGTH_BLOCK_1_NAME) ??
  programs.find((program) => isSpeedStrengthBlock1Program(program) && !program.name.includes('(Copy)'));

export const createSpeedStrengthBlock1Program = async (userId: string): Promise<string> => {
  const program = buildSpeedStrengthBlock1Program(userId);
  return createProgram(program);
};

export const ensureSpeedStrengthBlock1Program = async (
  existingPrograms?: Program[]
): Promise<{ created: boolean; updated: boolean; programId?: string }> => {
  const user = auth.currentUser;
  if (!user?.uid) {
    return { created: false, updated: false };
  }

  const programs = existingPrograms ?? await getPrograms();
  const existing = findSpeedStrengthBlock1Program(programs);
  if (!existing) {
    logger.debug('[starterProgramService] Creating Speed + Strength Blokk 1');
    const programId = await createSpeedStrengthBlock1Program(user.uid);
    return { created: true, updated: false, programId };
  }

  if (isCurrentSpeedStrengthBlock1Revision(existing)) {
    return { created: false, updated: false, programId: existing.id };
  }

  logger.debug('[starterProgramService] Updating Speed + Strength Blokk 1 to current revision');
  const nextProgram = buildSpeedStrengthBlock1Program(user.uid);
  await replaceProgram(existing.id, {
    ...nextProgram,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: existing.updatedAt,
  });
  return { created: false, updated: true, programId: existing.id };
};
