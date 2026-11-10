import type { Program } from '@/types/program';
import { createProgram } from '@/services/programService';

export const QUICK_SESSIONS_PROGRAM_NAME = 'Quick sessions';

export function findQuickSessionsProgram(programs: Program[]): Program | undefined {
  return programs.find((program) => program.name === QUICK_SESSIONS_PROGRAM_NAME);
}

/** Return existing Quick sessions program id, or create one for this coach. */
export async function ensureQuickSessionsProgram(
  programs: Program[],
  userId: string
): Promise<string> {
  const existing = findQuickSessionsProgram(programs);
  if (existing?.id) return existing.id;

  return createProgram({
    name: QUICK_SESSIONS_PROGRAM_NAME,
    description: 'One-off sessions created from the coach workspace',
    userId,
    createdBy: userId,
    sessions: [],
    isPublic: false,
  });
}
