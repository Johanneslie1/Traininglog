import { useCoachShellEnabled } from '@/features/coach-shell/useCoachShellEnabled';
import type { WorkspaceId } from '@/config/workspaces';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Athlete accounts always use the athlete workspace.
 * A coach account uses the coach desk only after this device turns it on.
 * Everyone else, including a signed-out visitor, stays in the personal app.
 */
export function useWorkspace(): WorkspaceId {
  const role = useUserRole();
  const coachShellEnabled = useCoachShellEnabled();

  if (role === 'athlete') return 'athlete';
  if (role === 'coach' && coachShellEnabled) return 'coach';
  return 'personal';
}
