import React from 'react';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  className?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  subtitle,
  className = '',
  headerActions,
  children,
}) => (
  <section className={`rounded-xl border border-border bg-bg-secondary p-4 ${className}`}>
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {headerActions}
    </div>
    {children}
  </section>
);

export default DashboardSection;
