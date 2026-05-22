import { Team } from '@/services/teamService';
import { WellnessMetricKey } from '@/types/wellness';

export type CoachRatingStatus = 'good' | 'watch' | 'outlier' | 'missing';

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

export interface CoachRatingsRow {
  athleteId: string;
  athleteName: string;
  email: string;
  teamIds: string[];
  teamNames: string[];
  dailyWellness: CoachDailyWellnessSummary;
  weeklyWellness: CoachWeeklyWellnessSummary;
  dailySrpe: CoachDailySrpeSummary;
  weeklySrpe: CoachWeeklySrpeSummary;
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
  selectedDate: string;
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
