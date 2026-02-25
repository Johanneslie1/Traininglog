/**
 * Activity Type Color Utilities
 * Centralized color management for activity types
 */

import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';

export interface ActivityTypeColorInfo {
  label: string;
  bgClass: string;
  bgColorClass: string;
  textClass: string;
  borderClass?: string;
}

/**
 * Get Tailwind class names for an activity type
 * @param activityType - The activity type enum value
 * @returns Object with color class names
 */
export function getActivityTypeColors(activityType?: ActivityType): ActivityTypeColorInfo {
  const type = normalizeActivityType(activityType);
  
  switch (type) {
    case ActivityType.RESISTANCE:
      return {
        label: 'Resistance',
        bgClass: 'bg-activity-resistance',
        bgColorClass: 'bg-activity-resistance-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-resistance',
      };
    case ActivityType.SPORT:
      return {
        label: 'Sport',
        bgClass: 'bg-activity-sport',
        bgColorClass: 'bg-activity-sport-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-sport',
      };
    case ActivityType.STRETCHING:
      return {
        label: 'Stretching',
        bgClass: 'bg-activity-stretching',
        bgColorClass: 'bg-activity-stretching-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-stretching',
      };
    case ActivityType.ENDURANCE:
      return {
        label: 'Endurance',
        bgClass: 'bg-activity-endurance',
        bgColorClass: 'bg-activity-endurance-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-endurance',
      };
    case ActivityType.SPEED_AGILITY:
      return {
        label: 'Speed/Agility',
        bgClass: 'bg-activity-speed',
        bgColorClass: 'bg-activity-speed-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-speed',
      };
    case ActivityType.OTHER:
      return {
        label: 'Other',
        bgClass: 'bg-activity-other',
        bgColorClass: 'bg-activity-other-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-other',
      };
    default:
      return {
        label: 'Resistance',
        bgClass: 'bg-activity-resistance',
        bgColorClass: 'bg-activity-resistance-bg',
        textClass: 'text-white',
        borderClass: 'border-activity-resistance',
      };
  }
}

/**
 * Get CSS variable values for an activity type (for programmatic use)
 * @param activityType - The activity type enum value
 * @returns Object with CSS variable names
 */
export function getActivityTypeCSSVars(activityType?: ActivityType) {
  const type = normalizeActivityType(activityType);
  
  const varMap: Record<ActivityType, { main: string; bg: string }> = {
    [ActivityType.RESISTANCE]: {
      main: 'var(--color-activity-resistance)',
      bg: 'var(--color-activity-resistance-bg)',
    },
    [ActivityType.SPORT]: {
      main: 'var(--color-activity-sport)',
      bg: 'var(--color-activity-sport-bg)',
    },
    [ActivityType.STRETCHING]: {
      main: 'var(--color-activity-stretching)',
      bg: 'var(--color-activity-stretching-bg)',
    },
    [ActivityType.ENDURANCE]: {
      main: 'var(--color-activity-endurance)',
      bg: 'var(--color-activity-endurance-bg)',
    },
    [ActivityType.SPEED_AGILITY]: {
      main: 'var(--color-activity-speed)',
      bg: 'var(--color-activity-speed-bg)',
    },
    [ActivityType.OTHER]: {
      main: 'var(--color-activity-other)',
      bg: 'var(--color-activity-other-bg)',
    },
  };
  
  return varMap[type];
}

/**
 * Get hex color values for an activity type (for chart libraries, etc.)
 * @param activityType - The activity type enum value
 * @returns Hex color string
 */
export function getActivityTypeHexColor(activityType?: ActivityType): string {
  const type = normalizeActivityType(activityType);
  
  const hexMap: Record<ActivityType, string> = {
    [ActivityType.RESISTANCE]: '#2563EB', // Blue
    [ActivityType.SPORT]: '#16A34A', // Green
    [ActivityType.STRETCHING]: '#06B6D4', // Cyan (changed from purple)
    [ActivityType.ENDURANCE]: '#EA580C', // Orange
    [ActivityType.SPEED_AGILITY]: '#DC2626', // Red
    [ActivityType.OTHER]: '#6B7280', // Gray
  };
  
  return hexMap[type];
}

/**
 * Get activity type icon/emoji
 * @param activityType - The activity type enum value
 * @returns Emoji string
 */
export function getActivityTypeIcon(activityType?: ActivityType): string {
  const type = normalizeActivityType(activityType);
  
  const iconMap: Record<ActivityType, string> = {
    [ActivityType.RESISTANCE]: '💪',
    [ActivityType.SPORT]: '⚽',
    [ActivityType.STRETCHING]: '🧘',
    [ActivityType.ENDURANCE]: '🏃',
    [ActivityType.SPEED_AGILITY]: '⚡',
    [ActivityType.OTHER]: '🎯',
  };
  
  return iconMap[type];
}

/**
 * Legacy helper - matches function name in ProgramBuilder
 * @deprecated Use getActivityTypeColors instead
 */
export function getActivityTypeInfo(activityType?: ActivityType) {
  const colors = getActivityTypeColors(activityType);
  return {
    label: colors.label,
    color: colors.bgClass,
    textColor: colors.textClass,
  };
}
