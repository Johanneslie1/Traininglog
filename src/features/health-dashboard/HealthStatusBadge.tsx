import React from 'react';
import type { CoachRatingStatus } from '@/types/coachRatings';
import { statusLabels, statusStyles } from '@/features/health-dashboard/healthDashboardFormatters';

interface HealthStatusBadgeProps {
  status: CoachRatingStatus;
  className?: string;
}

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({ status, className = 'text-sm font-semibold' }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 ${className} ${statusStyles[status]}`}>
    {statusLabels[status]}
  </span>
);
