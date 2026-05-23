import { Team } from '@/services/teamService';
import { WellnessMetricKey } from '@/types/wellness';

export type CoachRatingStatus = 'good' | 'watch' | 'outlier' | 'missing';
export type CoachRatingsViewMode = 'day' | 'week';

export type CoachWellnessTrendCategory =
  | 'better_than_normal'
  | 'normal'
  | 'below_normal'
  | 'clear_warning'
  | 'strong_concern'
  | 'no_baseline';

export interface CoachWellnessTrend {
  changeFromPrevious: number | null;
  previousScore: number | null;
  previousDate: string | null;
  baselineAverage: number | null;
  baselineSd: number | null;
  zScore: number | null;
  category: CoachWellnessTrendCategory;
  label: string;
  severity: CoachRatingStatus;
}

export interface CoachWellnessTrendPoint {
  date: string;
  score: number | null;
  rollingAverage: number | null;
  teamAverage: number | null;
}

export interface CoachRatingsTeamOption {
  id: string;
  name: string;
  athleteCount: number;
}

export interface CoachWellnessMetricValue {
  key: WellnessMetricKey;
  label: string;
  value: number;
  status: CoachRatingStatus;
  highIsGood: boolean;
}

export interface CoachDailyWellnessSummary {
  score: number | null;
  metrics: CoachWellnessMetricValue[];
  metricValues: Partial<Record<WellnessMetricKey, number>>;
  notes?: string;
  hasNotes: boolean;
  submitted: boolean;
}

export interface CoachWellnessSnapshotSummary extends CoachDailyWellnessSummary {
  date: string | null;
  isSelectedDate: boolean;
  submittedDays: number;
  totalDays: number;
}

export interface CoachWeeklyWellnessSummary {
  average: number | null;
  total: number;
  submittedDays: number;
}

export interface CoachDailySrpeSummary {
  rpe: number | null;
  durationMinutes: number;
  sessionLoad: number | null;
  submitted: boolean;
}

export interface CoachWeeklySrpeSummary {
  averageRpe: number | null;
  totalLoad: number;
  submittedDays: number;
}

export interface CoachAcwrSummary {
  acuteLoad: number | null;
  acuteReportedDays: number;
  chronicDailyAverageLoad: number | null;
  chronicReportedDays: number;
  ratio: number | null;
  label: string;
  status: CoachRatingStatus;
}

export interface CoachRatingsRow {
  athleteId: string;
  athleteName: string;
  email: string;
  teamIds: string[];
  teamNames: string[];
  dailyWellness: CoachDailyWellnessSummary;
  wellnessSnapshot: CoachWellnessSnapshotSummary;
  wellnessTrend: CoachWellnessTrend;
  wellnessTrendPoints: CoachWellnessTrendPoint[];
  weeklyWellness: CoachWeeklyWellnessSummary;
  dailySrpe: CoachDailySrpeSummary;
  weeklySrpe: CoachWeeklySrpeSummary;
  acwr: CoachAcwrSummary;
  status: CoachRatingStatus;
  outlierReasons: string[];
  missingDailyWellness: boolean;
  missingDailySrpe: boolean;
}

export interface CoachRatingsSummary {
  athleteCount: number;
  dailyWellnessAverage: number | null;
  weeklyWellnessAverage: number | null;
  weeklyWellnessTotal: number;
  dailySrpeAverage: number | null;
  dailySrpeTotalLoad: number;
  weeklySrpeAverage: number | null;
  weeklySrpeTotalLoad: number;
  missingDailyWellnessCount: number;
  missingDailySrpeCount: number;
  outlierCount: number;
}

export interface CoachRatingsDashboardData {
  viewMode: CoachRatingsViewMode;
  selectedDate: string;
  periodStartDate: string;
  periodEndDate: string;
  weekStartDate: string;
  weekEndDate: string;
  selectedTeamId: string | null;
  teams: CoachRatingsTeamOption[];
  rows: CoachRatingsRow[];
  summary: CoachRatingsSummary;
}

export interface CoachRatingsRequest {
  selectedDate: string;
  selectedTeamId?: string | null;
  viewMode?: CoachRatingsViewMode;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
}

export interface CoachRatingsTeamInput {
  team: Team;
  members: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: 'active' | 'inactive';
  }>;
}
