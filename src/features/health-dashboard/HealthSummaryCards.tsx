import React from 'react';

export interface HealthSummaryCardItem {
  id: string;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

interface HealthSummaryCardsProps {
  items: HealthSummaryCardItem[];
  columnsClassName?: string;
  cardClassName?: string;
}

export const HealthSummaryCards: React.FC<HealthSummaryCardsProps> = ({
  items,
  columnsClassName = 'grid gap-3 md:grid-cols-4',
  cardClassName = 'rounded-xl border border-border bg-bg-secondary px-4 py-3',
}) => (
  <div className={columnsClassName}>
    {items.map((item) => (
      <div key={item.id} className={cardClassName}>
        <p className="text-xs uppercase tracking-wide text-text-tertiary">{item.label}</p>
        <p className={`mt-1 text-2xl font-bold ${item.valueClassName || 'text-text-primary'}`}>
          {item.value}
        </p>
      </div>
    ))}
  </div>
);
