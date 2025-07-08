import React from 'react';
import { Exercise } from '@/types/exercise';
import { Session } from '@/types/session';
import { exportToCSV, exportToJSON } from '@/utils/exerciseExport';

interface ExportButtonsProps {
  session: Session;
  exercises: Record<string, Exercise>;
  userEmail: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  session,
  exercises,
  userEmail
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToJSON(session, exercises, userEmail)}
        className="px-3 py-1 rounded-lg bg-accent-primary text-white text-sm hover:bg-accent-primary/90"
      >
        Export JSON
      </button>
      <button
        onClick={() => exportToCSV(session, exercises, userEmail)}
        className="px-3 py-1 rounded-lg bg-accent-primary text-white text-sm hover:bg-accent-primary/90"
      >
        Export CSV
      </button>
    </div>
  );
};
