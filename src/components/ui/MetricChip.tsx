import React from 'react';

interface MetricChipProps {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  className?: string;
}

const toneStyles = {
  default: 'border-border bg-bg-tertiary text-text-secondary',
  accent: 'border-border-focus bg-accent-100 text-accent-700 shadow-glow',
  success: 'border-success-border bg-success-bg text-success-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  error: 'border-error-border bg-error-bg text-error-text',
  info: 'border-info-border bg-info-bg text-info-text',
};

const MetricChip: React.FC<MetricChipProps> = ({
  label,
  value,
  tone = 'default',
  icon,
  className = '',
}) => (
  <span className={`inline-flex min-h-[34px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${toneStyles[tone]} ${className}`}>
    {icon ? <span className="flex-shrink-0">{icon}</span> : null}
    <span className="text-[0.68rem] uppercase tracking-wide opacity-75">{label}</span>
    <span className="text-sm text-current">{value}</span>
  </span>
);

export default MetricChip;
