import React from 'react';
import { setCoachShellEnabled } from '@/features/coach-shell/coachShellPreference';
import { useCoachShellEnabled } from '@/features/coach-shell/useCoachShellEnabled';

const CoachWorkspaceSetting: React.FC = () => {
  const enabled = useCoachShellEnabled();

  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex-1 pr-4">
        <div id="coach-workspace-label" className="font-medium text-text-primary">
          Coach workspace
        </div>
        <p id="coach-workspace-description" className="mt-1 text-sm text-text-tertiary">
          Saved on this device. Opens a separate workspace for programs, sessions, assignment, and athlete review.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="coach-workspace-label"
        aria-describedby="coach-workspace-description"
        onClick={() => setCoachShellEnabled(!enabled)}
        className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          enabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
        }`}
      >
        <div
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 transform rounded-full bg-text-inverse transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default CoachWorkspaceSetting;
