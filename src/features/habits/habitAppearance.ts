const HABIT_COLORS = [
  'text-cyan-400 border-cyan-400',
  'text-blue-400 border-blue-400',
  'text-emerald-400 border-emerald-400',
  'text-orange-400 border-orange-400',
  'text-violet-400 border-violet-400',
  'text-rose-400 border-rose-400',
] as const;

export function habitColorClass(habitId: string): string {
  let hash = 0;
  for (let index = 0; index < habitId.length; index += 1) {
    hash = (hash + habitId.charCodeAt(index)) % HABIT_COLORS.length;
  }
  return HABIT_COLORS[hash];
}

export function habitScheduleLabel(kind: 'check' | 'count', target?: number, unit?: string): string {
  if (kind === 'count') {
    const amount = target ?? 1;
    return unit ? `${amount} ${unit}` : String(amount);
  }
  return 'Every day';
}
