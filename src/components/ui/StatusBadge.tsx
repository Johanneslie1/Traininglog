import React from 'react';

export type StatusBadgeTone = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info';

const toneStyles: Record<StatusBadgeTone, string> = {
  default: 'border-border bg-bg-tertiary text-text-secondary',
  accent: 'border-border-focus bg-accent-100 text-accent-700',
  success: 'border-success-border bg-success-bg text-success-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  error: 'border-error-border bg-error-bg text-error-text',
  info: 'border-info-border bg-info-bg text-info-text',
};

export const getAssignmentStatusDisplay = (status?: string | null): { label: string; tone: StatusBadgeTone } => {
  switch (status) {
    case 'not-started':
      return { label: 'Not Started', tone: 'default' };
    case 'in-progress':
      return { label: 'In Progress', tone: 'info' };
    case 'completed':
      return { label: 'Completed', tone: 'success' };
    case 'copied':
      return { label: 'Copied', tone: 'accent' };
    case 'failed':
      return { label: 'Failed', tone: 'error' };
    case 'exporting':
    case 'loading':
      return { label: 'In Progress', tone: 'info' };
    case 'connected':
      return { label: 'Connected', tone: 'success' };
    case 'disconnected':
      return { label: 'Not Connected', tone: 'default' };
    default:
      return { label: status || 'Unknown', tone: 'default' };
  }
};

interface StatusBadgeProps {
  label?: React.ReactNode;
  status?: string | null;
  tone?: StatusBadgeTone;
  icon?: React.ReactNode;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status,
  tone,
  icon,
  className = '',
}) => {
  const display = status ? getAssignmentStatusDisplay(status) : null;
  const finalTone = tone || display?.tone || 'default';
  const finalLabel = label ?? display?.label ?? status ?? 'Unknown';

  return (
    <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[finalTone]} ${className}`}>
      {icon ? <span className="flex-shrink-0">{icon}</span> : null}
      {finalLabel}
    </span>
  );
};

export default StatusBadge;
