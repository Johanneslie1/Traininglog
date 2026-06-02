import React from 'react';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';

export type ActivityBadgeVariant = 'solid' | 'soft' | 'dot';

export interface ActivityDisplayInfo {
  label: string;
  solidClassName: string;
  softClassName: string;
  dotClassName: string;
}

export const getActivityDisplayInfo = (activityType?: ActivityType | string | null): ActivityDisplayInfo => {
  const type = normalizeActivityType(activityType ?? undefined);

  switch (type) {
    case ActivityType.RESISTANCE:
      return {
        label: 'Resistance',
        solidClassName: 'bg-activity-resistance text-text-on-accent',
        softClassName: 'border-activity-resistance bg-activity-resistance-bg text-activity-resistance',
        dotClassName: 'bg-activity-resistance',
      };
    case ActivityType.SPORT:
      return {
        label: 'Sport',
        solidClassName: 'bg-activity-sport text-text-on-accent',
        softClassName: 'border-activity-sport bg-activity-sport-bg text-activity-sport',
        dotClassName: 'bg-activity-sport',
      };
    case ActivityType.STRETCHING:
      return {
        label: 'Stretching',
        solidClassName: 'bg-activity-stretching text-text-on-accent',
        softClassName: 'border-activity-stretching bg-activity-stretching-bg text-activity-stretching',
        dotClassName: 'bg-activity-stretching',
      };
    case ActivityType.ENDURANCE:
      return {
        label: 'Endurance',
        solidClassName: 'bg-activity-endurance text-text-on-accent',
        softClassName: 'border-activity-endurance bg-activity-endurance-bg text-activity-endurance',
        dotClassName: 'bg-activity-endurance',
      };
    case ActivityType.SPEED_AGILITY:
      return {
        label: 'Speed/Agility',
        solidClassName: 'bg-activity-speed text-text-on-accent',
        softClassName: 'border-activity-speed bg-activity-speed-bg text-activity-speed',
        dotClassName: 'bg-activity-speed',
      };
    case ActivityType.OTHER:
    default:
      return {
        label: 'Other',
        solidClassName: 'bg-activity-other text-text-on-accent',
        softClassName: 'border-activity-other bg-activity-other-bg text-activity-other',
        dotClassName: 'bg-activity-other',
      };
  }
};

interface ActivityBadgeProps {
  activityType?: ActivityType | string | null;
  variant?: ActivityBadgeVariant;
  className?: string;
  showLabel?: boolean;
  title?: string;
}

const ActivityBadge: React.FC<ActivityBadgeProps> = ({
  activityType,
  variant = 'soft',
  className = '',
  showLabel = true,
  title,
}) => {
  const info = getActivityDisplayInfo(activityType);

  if (variant === 'dot') {
    return (
      <span
        aria-label={info.label}
        title={title}
        className={`inline-flex h-3 w-3 flex-shrink-0 rounded-full ${info.dotClassName} ${className}`}
      />
    );
  }

  const toneClassName = variant === 'solid' ? info.solidClassName : info.softClassName;

  return (
    <span title={title} className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClassName} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${info.dotClassName}`} />
      {showLabel ? info.label : null}
    </span>
  );
};

export default ActivityBadge;
