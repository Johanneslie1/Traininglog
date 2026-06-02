// UI Components Library
// Import and re-export all UI components for easy access

export { default as Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { default as FloatingActionButton } from './FloatingActionButton';

export { default as Skeleton, ExerciseCardSkeleton, ExerciseListSkeleton } from './Skeleton';
export { MetricGridSkeleton, SettingsSectionSkeleton } from './Skeleton';

export { default as EmptyState } from './EmptyState';

export { default as Card, CardHeader, CardBody, CardFooter } from './Card';

export { default as DashboardSection } from './DashboardSection';

export { default as ConfirmDialog } from './ConfirmDialog';
export { default as InlineErrorState } from './InlineErrorState';
export { default as LoadingState } from './LoadingState';
export { default as ActivityBadge, getActivityDisplayInfo } from './ActivityBadge';
export type { ActivityBadgeVariant, ActivityDisplayInfo } from './ActivityBadge';
export { default as StatusBadge, getAssignmentStatusDisplay } from './StatusBadge';
export type { StatusBadgeTone } from './StatusBadge';
export { default as MetricChip } from './MetricChip';
export { default as SectionDivider } from './SectionDivider';
export { default as StickyBottomActions } from './StickyBottomActions';
export { default as ViewToggle } from './ViewToggle';
