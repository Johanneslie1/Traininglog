import React from 'react';

interface SectionDividerProps {
  label: string;
  count?: number;
  className?: string;
}

const SectionDivider: React.FC<SectionDividerProps> = ({ label, count, className = '' }) => (
  <div className={`sticky top-0 z-[1] -mx-1 flex items-center gap-3 bg-bg-primary/90 px-1 py-2 backdrop-blur ${className}`}>
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">{label}</span>
    <div className="h-px flex-1 bg-border" />
    {typeof count === 'number' ? (
      <span className="rounded-full border border-border bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
        {count}
      </span>
    ) : null}
  </div>
);

export default SectionDivider;
