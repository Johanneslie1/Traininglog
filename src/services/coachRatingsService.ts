import { getAuth } from 'firebase/auth';
import { getCoachTeams, getTeamMembers, syncCoachAthleteAccess } from '@/services/teamService';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { getSrpeByDateRange } from '@/services/srpeService';
import { addDays, getLocalWeekDateRange, dateKeyToLocalDate, toLocalDateString } from '@/utils/dateUtils';
import { SrpeLog } from '@/types/srpe';
import { WellnessLog, WELLNESS_METRICS, WellnessMetricKey } from '@/types/wellness';
import {
  CoachAcwrSummary,
  CoachDailySrpeSummary,
  CoachDailyWellnessSummary,
  CoachRatingStatus,
  CoachRatingsDashboardData,
  CoachRatingsRequest,
  CoachRatingsRow,
  CoachRatingsSummary,
  CoachRatingsTeamInput,
  CoachRatingsTeamOption,
  CoachRatingsViewMode,
  CoachWeeklySrpeSummary,
  CoachWeeklyWellnessSummary,
  CoachWellnessSnapshotSummary,
  CoachWellnessTrend,
  CoachWellnessTrendPoint,
  CoachWellnessMetricValue,
} from '@/types/coachRatings';

interface AthleteAccumulator {
  athleteId: string;
  athleteName: string;
  email: string;
  teamIds: Set<string>;
  teamNames: Set<string>;
}

const EMPTY_SUMMARY: CoachRatingsSummary = {
  athleteCount: 0,
  dailyWellnessAverage: null,
  weeklyWellnessAverage: null,
  weeklyWellnessTotal: 0,
  dailySrpeAverage: null,
  dailySrpeTotalLoad: 0,
  weeklySrpeAverage: null,
  weeklySrpeTotalLoad: 0,
  missingDailyWellnessCount: 0,
  missingDailySrpeCount: 0,
  outlierCount: 0,
};

const WELLNESS_BASELINE_DAYS = 28;
const WELLNESS_CHART_DAYS = 28;
const ACWR_CHRONIC_DAYS = 28;
const MIN_BASELINE_SCORES = 3;

function ensureCoachId(): string {
  const uid = getAuth().currentUser?.uid;
  if (!uid) {
    throw new Error('User must be logged in');
  }
  return uid;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function isPermissionDenied(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: string }).code === 'permission-denied';
  }

  return error instanceof Error && error.message.toLowerCase().includes('insufficient permissions');
}

function getGoodRatio(value: number, highIsGood: boolean, scaleMax: number): number {
  const clampedValue = Math.max(1, Math.min(scaleMax, value));
  return highIsGood
    ? (clampedValue - 1) / (scaleMax - 1)
    : (scaleMax - clampedValue) / (scaleMax - 1);
}

function scoreMetric(value: number, highIsGood: boolean, scaleMax: number): CoachRatingStatus {
  const goodRatio = getGoodRatio(value, highIsGood, scaleMax);
  if (goodRatio >= 0.67) return 'good';
  if (goodRatio >= 0.45) return 'watch';
  return 'outlier';
}

export function calculateWellnessScore(log: WellnessLog | null | undefined): number | null {
  if (!log) return null;

  const goodRatios = WELLNESS_METRICS
    .map((metric) => {
      const value = log[metric.key];
      if (typeof value !== 'number') return null;
      return getGoodRatio(value, metric.highIsGood, metric.scaleMax);
    })
    .filter((value): value is number => typeof value === 'number');

  const averageGoodRatio = average(goodRatios);
  return averageGoodRatio === null ? null : roundOne(1 + averageGoodRatio * 6);
}

function summarizeDailyWellness(log: WellnessLog | null | undefined): CoachDailyWellnessSummary {
  if (!log) {
    return {
      score: null,
      metrics: [],
      metricValues: {},
      hasNotes: false,
      submitted: false,
    };
  }

  const metricValues: Partial<Record<WellnessMetricKey, number>> = {};
  const metrics: CoachWellnessMetricValue[] = WELLNESS_METRICS.flatMap((metric) => {
    const value = log[metric.key];
    if (typeof value !== 'number') return [];
    metricValues[metric.key] = value;

    return [{
      key: metric.key,
      label: metric.label,
      value,
      highIsGood: metric.highIsGood,
      status: scoreMetric(value, metric.highIsGood, metric.scaleMax),
    }];
  });

  return {
    score: calculateWellnessScore(log),
    metrics,
    metricValues,
    notes: log.notes,
    hasNotes: Boolean(log.notes?.trim()),
    submitted: metrics.length > 0,
  };
}

function summarizeWellnessSnapshot(
  log: WellnessLog | null | undefined,
  selectedDate: string
): CoachWellnessSnapshotSummary {
  const summary = summarizeDailyWellness(log);

  return {
    ...summary,
    date: log?.date ?? null,
    isSelectedDate: log?.date === selectedDate,
    submittedDays: summary.submitted ? 1 : 0,
    totalDays: 1,
  };
}

function summarizeWellnessPeriod(logs: WellnessLog[], totalDays: number): CoachWellnessSnapshotSummary {
  const logsWithScores = logs
    .map((log) => ({ log, score: calculateWellnessScore(log) }))
    .filter((entry): entry is { log: WellnessLog; score: number } => entry.score !== null);
  const metricValues: Partial<Record<WellnessMetricKey, number>> = {};
  const metrics: CoachWellnessMetricValue[] = WELLNESS_METRICS.flatMap((metric) => {
    const values = logs
      .map((log) => log[metric.key])
      .filter((value): value is number => typeof value === 'number');
    const metricAverage = average(values);
    if (metricAverage === null) return [];

    const roundedValue = roundOne(metricAverage);
    metricValues[metric.key] = roundedValue;

    return [{
      key: metric.key,
      label: metric.label,
      value: roundedValue,
      highIsGood: metric.highIsGood,
      status: scoreMetric(roundedValue, metric.highIsGood, metric.scaleMax),
    }];
  });
  const scoreAverage = average(logsWithScores.map((entry) => entry.score));

  return {
    score: scoreAverage === null ? null : roundOne(scoreAverage),
    metrics,
    metricValues,
    hasNotes: logs.some((log) => Boolean(log.notes?.trim())),
    submitted: logsWithScores.length > 0,
    date: null,
    isSelectedDate: false,
    submittedDays: logsWithScores.length,
    totalDays,
  };
}

function summarizeWeeklyWellness(logs: WellnessLog[]): CoachWeeklyWellnessSummary {
  const dailyScores = logs
    .map(calculateWellnessScore)
    .filter((score): score is number => score !== null);

  return {
    average: dailyScores.length > 0 ? roundOne(average(dailyScores) as number) : null,
    total: roundOne(dailyScores.reduce((sum, score) => sum + score, 0)),
    submittedDays: dailyScores.length,
  };
}

function summarizeDailySrpe(log: SrpeLog | null | undefined): CoachDailySrpeSummary {
  if (!log) {
    return {
      rpe: null,
      durationMinutes: 0,
      sessionLoad: null,
      submitted: false,
    };
  }

  return {
    rpe: log.rpe,
    durationMinutes: log.durationMinutes,
    sessionLoad: log.sessionLoad,
    submitted: true,
  };
}

function summarizeWeeklySrpe(logs: SrpeLog[]): CoachWeeklySrpeSummary {
  const rpeValues = logs.map((log) => log.rpe);

  return {
    averageRpe: rpeValues.length > 0 ? roundOne(average(rpeValues) as number) : null,
    totalLoad: logs.reduce((sum, log) => sum + log.sessionLoad, 0),
    submittedDays: logs.length,
  };
}

function summarizeAcwr(acuteLogs: SrpeLog[], chronicLogs: SrpeLog[]): CoachAcwrSummary {
  const acuteLoads = acuteLogs.map((log) => log.sessionLoad);
  const chronicLoads = chronicLogs.map((log) => log.sessionLoad);
  const acuteLoad = acuteLoads.length > 0
    ? roundOne(acuteLoads.reduce((sum, load) => sum + load, 0))
    : null;
  const chronicDailyAverageLoad = chronicLoads.length > 0
    ? roundOne(chronicLoads.reduce((sum, load) => sum + load, 0) / chronicLoads.length)
    : null;
  const acuteDailyAverageLoad = acuteLoads.length > 0
    ? acuteLoads.reduce((sum, load) => sum + load, 0) / acuteLoads.length
    : null;
  const ratio = acuteDailyAverageLoad !== null && chronicDailyAverageLoad !== null && chronicDailyAverageLoad > 0
    ? roundTwo(acuteDailyAverageLoad / chronicDailyAverageLoad)
    : null;

  if (ratio === null) {
    return {
      acuteLoad,
      acuteReportedDays: acuteLoads.length,
      chronicDailyAverageLoad,
      chronicReportedDays: chronicLoads.length,
      ratio: null,
      label: 'No ACWR',
      status: 'missing',
    };
  }

  if (ratio >= 1.5) {
    return {
      acuteLoad,
      acuteReportedDays: acuteLoads.length,
      chronicDailyAverageLoad,
      chronicReportedDays: chronicLoads.length,
      ratio,
      label: 'High ACWR',
      status: 'outlier',
    };
  }

  if (ratio >= 1.3 || ratio < 0.8) {
    return {
      acuteLoad,
      acuteReportedDays: acuteLoads.length,
      chronicDailyAverageLoad,
      chronicReportedDays: chronicLoads.length,
      ratio,
      label: ratio < 0.8 ? 'Low ACWR' : 'Elevated ACWR',
      status: 'watch',
    };
  }

  return {
    acuteLoad,
    acuteReportedDays: acuteLoads.length,
    chronicDailyAverageLoad,
    chronicReportedDays: chronicLoads.length,
    ratio,
    label: 'Normal ACWR',
    status: 'good',
  };
}

function buildSummary(rows: CoachRatingsRow[], viewMode: CoachRatingsViewMode): CoachRatingsSummary {
  if (rows.length === 0) return EMPTY_SUMMARY;

  return {
    athleteCount: rows.length,
    dailyWellnessAverage: nullableRoundedAverage(rows.map((row) => row.wellnessSnapshot.score)),
    weeklyWellnessAverage: nullableRoundedAverage(rows.map((row) => row.weeklyWellness.average)),
    weeklyWellnessTotal: roundOne(rows.reduce((sum, row) => sum + row.weeklyWellness.total, 0)),
    dailySrpeAverage: viewMode === 'day'
      ? nullableRoundedAverage(rows.map((row) => row.dailySrpe.rpe))
      : nullableRoundedAverage(rows.map((row) => row.weeklySrpe.averageRpe)),
    dailySrpeTotalLoad: viewMode === 'day'
      ? rows.reduce((sum, row) => sum + (row.dailySrpe.sessionLoad || 0), 0)
      : rows.reduce((sum, row) => sum + row.weeklySrpe.totalLoad, 0),
    weeklySrpeAverage: nullableRoundedAverage(rows.map((row) => row.weeklySrpe.averageRpe)),
    weeklySrpeTotalLoad: rows.reduce((sum, row) => sum + row.weeklySrpe.totalLoad, 0),
    missingDailyWellnessCount: viewMode === 'day'
      ? rows.filter((row) => row.missingDailyWellness).length
      : rows.filter((row) => row.weeklyWellness.submittedDays === 0).length,
    missingDailySrpeCount: viewMode === 'day'
      ? rows.filter((row) => row.missingDailySrpe).length
      : rows.filter((row) => row.weeklySrpe.submittedDays === 0).length,
    outlierCount: rows.filter((row) => row.status === 'outlier').length,
  };
}

function nullableRoundedAverage(values: Array<number | null>): number | null {
  const presentValues = values.filter((value): value is number => value !== null);
  const value = average(presentValues);
  return value === null ? null : roundOne(value);
}

function standardDeviation(values: number[]): number | null {
  if (values.length === 0) return null;

  const mean = average(values) as number;
  const variance = average(values.map((value) => (value - mean) ** 2));
  return variance === null ? null : Math.sqrt(variance);
}

function dateKeyDaysBefore(dateKey: string, days: number): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return dateKey;
  return toLocalDateString(addDays(date, -days));
}

function buildDateKeys(startDateKey: string, days: number): string[] {
  const startDate = dateKeyToLocalDate(startDateKey);
  if (!startDate) return [];

  return Array.from({ length: days }, (_, index) => toLocalDateString(addDays(startDate, index)));
}

function buildDateRangeKeys(startDateKey: string, endDateKey: string): string[] {
  const startDate = dateKeyToLocalDate(startDateKey);
  const endDate = dateKeyToLocalDate(endDateKey);
  if (!startDate || !endDate || startDate > endDate) return [];

  const keys: string[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    keys.push(toLocalDateString(date));
  }
  return keys;
}

function scoreLogsByDate(logs: WellnessLog[]): Map<string, number> {
  const scores = new Map<string, number>();

  logs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((log) => {
      const score = calculateWellnessScore(log);
      if (score !== null) {
        scores.set(log.date, score);
      }
    });

  return scores;
}

function buildWellnessTrend(logs: WellnessLog[], selectedDate: string): CoachWellnessTrend {
  const scoresByDate = scoreLogsByDate(logs);
  const todayScore = scoresByDate.get(selectedDate) ?? null;

  if (todayScore === null) {
    return {
      changeFromPrevious: null,
      previousScore: null,
      previousDate: null,
      baselineAverage: null,
      baselineSd: null,
      zScore: null,
      category: 'no_baseline',
      label: 'No wellness logged',
      severity: 'missing',
    };
  }

  const previousEntries = Array.from(scoresByDate.entries())
    .filter(([date]) => date < selectedDate)
    .sort(([a], [b]) => a.localeCompare(b));
  const previousEntry = previousEntries[previousEntries.length - 1] ?? null;
  const previousScore = previousEntry?.[1] ?? null;
  const changeFromPrevious = previousScore === null ? null : roundOne(todayScore - previousScore);
  const baselineStartDate = dateKeyDaysBefore(selectedDate, WELLNESS_BASELINE_DAYS);
  const baselineScores = previousEntries
    .filter(([date]) => date >= baselineStartDate)
    .map(([, score]) => score);

  if (baselineScores.length < MIN_BASELINE_SCORES) {
    return {
      changeFromPrevious,
      previousScore,
      previousDate: previousEntry?.[0] ?? null,
      baselineAverage: null,
      baselineSd: null,
      zScore: null,
      category: 'no_baseline',
      label: 'No baseline yet',
      severity: 'good',
    };
  }

  const baselineAverage = average(baselineScores) as number;
  const baselineSd = standardDeviation(baselineScores) || 0;
  const zScore = baselineSd > 0 ? (todayScore - baselineAverage) / baselineSd : null;

  let category: CoachWellnessTrend['category'] = 'normal';
  let label = 'Normal';
  let severity: CoachRatingStatus = 'good';

  if (zScore !== null) {
    if (zScore <= -2) {
      category = 'strong_concern';
      label = 'Strong concern';
      severity = 'outlier';
    } else if (zScore <= -1.5) {
      category = 'clear_warning';
      label = 'Clear warning';
      severity = 'watch';
    } else if (zScore <= -1) {
      category = 'below_normal';
      label = 'Below normal';
    } else if (zScore >= 1) {
      category = 'better_than_normal';
      label = 'Better than normal';
    }
  } else if (todayScore < baselineAverage) {
    category = 'below_normal';
    label = 'Below normal';
    severity = 'watch';
  } else if (todayScore > baselineAverage) {
    category = 'better_than_normal';
    label = 'Better than normal';
  }

  if (category === 'normal' && changeFromPrevious !== null && changeFromPrevious <= -0.5) {
    label = 'Slight drop';
    severity = 'watch';
  }

  return {
    changeFromPrevious,
    previousScore,
    previousDate: previousEntry?.[0] ?? null,
    baselineAverage: roundOne(baselineAverage),
    baselineSd: roundTwo(baselineSd),
    zScore: zScore === null ? null : roundTwo(zScore),
    category,
    label,
    severity,
  };
}

function buildWellnessTrendPoints(
  logs: WellnessLog[],
  chartDateKeys: string[],
  teamAverageByDate: Map<string, number>
): CoachWellnessTrendPoint[] {
  const scoresByDate = scoreLogsByDate(logs);

  return chartDateKeys.map((date) => {
    const rollingStartDate = dateKeyDaysBefore(date, WELLNESS_BASELINE_DAYS - 1);
    const rollingScores = Array.from(scoresByDate.entries())
      .filter(([scoreDate]) => scoreDate >= rollingStartDate && scoreDate <= date)
      .map(([, score]) => score);
    const rollingAverage = average(rollingScores);

    return {
      date,
      score: scoresByDate.get(date) ?? null,
      rollingAverage: rollingAverage === null ? null : roundOne(rollingAverage),
      teamAverage: teamAverageByDate.get(date) ?? null,
    };
  });
}

function classifyRows(rows: CoachRatingsRow[], viewMode: CoachRatingsViewMode): CoachRatingsRow[] {
  const dailyWellnessAverage = nullableRoundedAverage(rows.map((row) => row.wellnessSnapshot.score));
  const weeklyWellnessAverage = nullableRoundedAverage(rows.map((row) => row.weeklyWellness.average));
  const weeklyLoadAverage = nullableRoundedAverage(rows.map((row) => row.weeklySrpe.totalLoad));

  return rows.map((row) => {
    const outlierReasons: string[] = [];
    const watchReasons: string[] = [];

    if (row.wellnessSnapshot.score !== null) {
      if (row.wellnessSnapshot.score < 4) {
        outlierReasons.push(viewMode === 'day' ? 'Low daily wellness' : 'Low weekly wellness');
      } else if (row.wellnessSnapshot.score < 5) {
        watchReasons.push(viewMode === 'day' ? 'Daily wellness needs attention' : 'Weekly wellness needs attention');
      }

      if (dailyWellnessAverage !== null && row.wellnessSnapshot.score <= dailyWellnessAverage - 1.5) {
        outlierReasons.push('Wellness below team average');
      } else if (dailyWellnessAverage !== null && row.wellnessSnapshot.score <= dailyWellnessAverage - 0.8) {
        watchReasons.push('Wellness below team average');
      }
    }

    if (viewMode === 'day' && row.wellnessTrend.severity === 'outlier') {
      outlierReasons.push(row.wellnessTrend.label);
    } else if (viewMode === 'day' && row.wellnessTrend.severity === 'watch') {
      watchReasons.push(row.wellnessTrend.label);
    }

    if (viewMode === 'day' && row.weeklyWellness.average !== null) {
      if (row.weeklyWellness.average < 4) {
        outlierReasons.push('Low weekly wellness');
      } else if (row.weeklyWellness.average < 5) {
        watchReasons.push('Weekly wellness needs attention');
      }

      if (weeklyWellnessAverage !== null && row.weeklyWellness.average <= weeklyWellnessAverage - 1.2) {
        outlierReasons.push('Weekly wellness below team average');
      }
    }

    row.wellnessSnapshot.metrics.forEach((metric) => {
      if (metric.status === 'outlier') {
        outlierReasons.push(`${metric.label} red flag`);
      } else if (metric.status === 'watch') {
        watchReasons.push(`${metric.label} watch`);
      }
    });

    if (viewMode === 'day' && row.dailySrpe.rpe !== null) {
      if (row.dailySrpe.rpe >= 9) {
        outlierReasons.push('Very high daily RPE');
      } else if (row.dailySrpe.rpe >= 8) {
        watchReasons.push('High daily RPE');
      }
    }

    if (viewMode !== 'day' && weeklyLoadAverage !== null && weeklyLoadAverage > 0 && row.weeklySrpe.totalLoad > 0) {
      if (row.weeklySrpe.totalLoad >= weeklyLoadAverage * 1.5) {
        outlierReasons.push('Weekly sRPE load above team average');
      } else if (row.weeklySrpe.totalLoad >= weeklyLoadAverage * 1.25) {
        watchReasons.push('Weekly sRPE load above team average');
      }
    }

    if (viewMode === 'day' && row.missingDailyWellness) {
      watchReasons.push('Missing daily wellness');
    }

    if (viewMode === 'day' && row.missingDailySrpe) {
      watchReasons.push('Missing daily RPE');
    }

    if (viewMode !== 'day' && row.weeklyWellness.submittedDays === 0) {
      watchReasons.push('No wellness this week');
    }

    if (viewMode !== 'day' && row.weeklySrpe.submittedDays === 0) {
      watchReasons.push('No RPE this week');
    }

    if (row.acwr.status === 'outlier') {
      outlierReasons.push(row.acwr.label);
    } else if (row.acwr.status === 'watch') {
      watchReasons.push(row.acwr.label);
    }

    const status: CoachRatingStatus =
      outlierReasons.length > 0
        ? 'outlier'
        : watchReasons.length > 0
          ? row.missingDailyWellness && row.missingDailySrpe && row.weeklyWellness.submittedDays === 0 && row.weeklySrpe.submittedDays === 0
            ? 'missing'
            : 'watch'
          : 'good';

    return {
      ...row,
      status,
      outlierReasons: outlierReasons.length > 0 ? outlierReasons : watchReasons,
    };
  });
}

export function buildCoachRatingsDashboardData(params: {
  selectedDate: string;
  viewMode?: CoachRatingsViewMode;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  selectedTeamId?: string | null;
  teamsWithMembers: CoachRatingsTeamInput[];
  wellnessLogsByAthleteId: Map<string, WellnessLog[]>;
  srpeLogsByAthleteId: Map<string, SrpeLog[]>;
}): CoachRatingsDashboardData {
  const selectedLocalDate = dateKeyToLocalDate(params.selectedDate);
  if (!selectedLocalDate) {
    throw new Error('Invalid selected date. Expected YYYY-MM-DD');
  }

  const weekRange = getLocalWeekDateRange(selectedLocalDate);
  const viewMode = params.viewMode || 'day';
  const requestedPeriodStart = params.periodStartDate || weekRange.startDateKey;
  const requestedPeriodEnd = params.periodEndDate || weekRange.endDateKey;
  const periodStartDate = requestedPeriodStart <= requestedPeriodEnd ? requestedPeriodStart : requestedPeriodEnd;
  const periodEndDate = requestedPeriodStart <= requestedPeriodEnd ? requestedPeriodEnd : requestedPeriodStart;
  const periodDateKeys = buildDateRangeKeys(periodStartDate, periodEndDate);
  const selectedTeamId = params.selectedTeamId || null;
  const periodEndLocalDate = dateKeyToLocalDate(periodEndDate) || weekRange.endDate;
  const chronicStartDateKey = toLocalDateString(addDays(periodEndLocalDate, -(ACWR_CHRONIC_DAYS - 1)));
  const chartStartDateKey = toLocalDateString(addDays(selectedLocalDate, -(WELLNESS_CHART_DAYS - 1)));
  const chartDateKeys = buildDateKeys(chartStartDateKey, WELLNESS_CHART_DAYS);
  const includedTeams = selectedTeamId
    ? params.teamsWithMembers.filter(({ team }) => team.id === selectedTeamId)
    : params.teamsWithMembers;

  const athleteMap = new Map<string, AthleteAccumulator>();

  includedTeams.forEach(({ team, members }) => {
    members
      .filter((member) => member.status !== 'inactive')
      .forEach((member) => {
        const existing = athleteMap.get(member.id);
        const athleteName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;

        if (existing) {
          existing.teamIds.add(team.id);
          existing.teamNames.add(team.name);
          return;
        }

        athleteMap.set(member.id, {
          athleteId: member.id,
          athleteName,
          email: member.email,
          teamIds: new Set([team.id]),
          teamNames: new Set([team.name]),
        });
      });
  });

  const teamAverageByDate = new Map<string, number>();
  chartDateKeys.forEach((date) => {
    const scores = Array.from(athleteMap.values())
      .map((athlete) => {
        const wellnessLogs = params.wellnessLogsByAthleteId.get(athlete.athleteId) || [];
        return scoreLogsByDate(wellnessLogs).get(date) ?? null;
      })
      .filter((score): score is number => score !== null);
    const dateAverage = average(scores);
    if (dateAverage !== null) {
      teamAverageByDate.set(date, roundOne(dateAverage));
    }
  });

  const rows = Array.from(athleteMap.values())
    .map((athlete) => {
      const wellnessLogs = params.wellnessLogsByAthleteId.get(athlete.athleteId) || [];
      const srpeLogs = params.srpeLogsByAthleteId.get(athlete.athleteId) || [];
      const weeklyWellnessLogs = wellnessLogs.filter(
        (log) => log.date >= periodStartDate && log.date <= periodEndDate
      );
      const acuteSrpeLogs = srpeLogs.filter(
        (log) => log.date >= periodStartDate && log.date <= periodEndDate
      );
      const chronicSrpeLogs = srpeLogs.filter(
        (log) => log.date >= chronicStartDateKey && log.date <= weekRange.endDateKey
      );
      const dailyWellnessLog = wellnessLogs.find((log) => log.date === params.selectedDate) || null;
      const dailySrpeLog = srpeLogs.find((log) => log.date === params.selectedDate) || null;
      const dailyWellness = summarizeDailyWellness(dailyWellnessLog);
      const dailySrpe = summarizeDailySrpe(dailySrpeLog);
      const wellnessSnapshot = viewMode === 'day'
        ? summarizeWellnessSnapshot(dailyWellnessLog, params.selectedDate)
        : summarizeWellnessPeriod(weeklyWellnessLogs, periodDateKeys.length);

      return {
        athleteId: athlete.athleteId,
        athleteName: athlete.athleteName,
        email: athlete.email,
        teamIds: Array.from(athlete.teamIds),
        teamNames: Array.from(athlete.teamNames),
        dailyWellness,
        wellnessSnapshot,
        wellnessTrend: buildWellnessTrend(wellnessLogs, wellnessSnapshot.date || params.selectedDate),
        wellnessTrendPoints: buildWellnessTrendPoints(wellnessLogs, chartDateKeys, teamAverageByDate),
        weeklyWellness: summarizeWeeklyWellness(weeklyWellnessLogs),
        dailySrpe,
        weeklySrpe: summarizeWeeklySrpe(acuteSrpeLogs),
        acwr: summarizeAcwr(acuteSrpeLogs, chronicSrpeLogs),
        status: 'good' as CoachRatingStatus,
        outlierReasons: [],
        missingDailyWellness: !dailyWellness.submitted,
        missingDailySrpe: !dailySrpe.submitted,
      };
    })
    .sort((a, b) => a.athleteName.localeCompare(b.athleteName));

  const classifiedRows = classifyRows(rows, viewMode);
  const summary = buildSummary(classifiedRows, viewMode);
  const teamOptions: CoachRatingsTeamOption[] = params.teamsWithMembers.map(({ team, members }) => ({
    id: team.id,
    name: team.name,
    athleteCount: members.filter((member) => member.status !== 'inactive').length,
  }));

  return {
    viewMode,
    selectedDate: params.selectedDate,
    periodStartDate,
    periodEndDate,
    weekStartDate: weekRange.startDateKey,
    weekEndDate: weekRange.endDateKey,
    selectedTeamId,
    teams: teamOptions,
    rows: classifiedRows,
    summary,
  };
}

export async function getCoachRatingsDashboard(
  request: CoachRatingsRequest
): Promise<CoachRatingsDashboardData> {
  const coachId = ensureCoachId();
  const selectedLocalDate = dateKeyToLocalDate(request.selectedDate);
  if (!selectedLocalDate) {
    throw new Error('Invalid selected date. Expected YYYY-MM-DD');
  }

  const weekRange = getLocalWeekDateRange(selectedLocalDate);
  const viewMode = request.viewMode || 'day';
  const requestedPeriodStart = request.periodStartDate || weekRange.startDateKey;
  const requestedPeriodEnd = request.periodEndDate || weekRange.endDateKey;
  const periodStartDate = requestedPeriodStart <= requestedPeriodEnd ? requestedPeriodStart : requestedPeriodEnd;
  const periodEndDate = requestedPeriodStart <= requestedPeriodEnd ? requestedPeriodEnd : requestedPeriodStart;
  const periodEndLocalDate = dateKeyToLocalDate(periodEndDate) || weekRange.endDate;
  const wellnessStartDateKey = toLocalDateString(addDays(selectedLocalDate, -WELLNESS_BASELINE_DAYS));
  const wellnessEndDateKey = periodEndDate > weekRange.endDateKey ? periodEndDate : weekRange.endDateKey;
  const srpeStartDateKey = toLocalDateString(addDays(periodEndLocalDate, -(ACWR_CHRONIC_DAYS - 1)));
  const teams = await getCoachTeams();
  const teamsWithMembers = await Promise.all(
    teams.map(async (team) => ({
      team,
      members: await getTeamMembers(team.id),
    }))
  );

  const selectedTeamId = request.selectedTeamId || null;
  const includedTeams = selectedTeamId
    ? teamsWithMembers.filter(({ team }) => team.id === selectedTeamId)
    : teamsWithMembers;
  const athleteIds = Array.from(new Set(
    includedTeams.flatMap(({ members }) =>
      members.filter((member) => member.status !== 'inactive').map((member) => member.id)
    )
  ));

  const accessResults = await Promise.allSettled(
    athleteIds.map((athleteId) => syncCoachAthleteAccess(coachId, athleteId))
  );

  accessResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn('[coachRatings] Could not sync coach-athlete access before loading ratings', {
        coachId,
        athleteId: athleteIds[index],
        error: result.reason,
      });
    }
  });

  const athleteLogPairs = await Promise.all(
    athleteIds.map(async (athleteId) => {
      const [wellnessResult, srpeResult] = await Promise.allSettled([
        getWellnessByDateRange(athleteId, wellnessStartDateKey, wellnessEndDateKey),
        getSrpeByDateRange(athleteId, srpeStartDateKey, weekRange.endDateKey),
      ]);

      const wellnessLogs = wellnessResult.status === 'fulfilled' ? wellnessResult.value : [];
      const srpeLogs = srpeResult.status === 'fulfilled' ? srpeResult.value : [];

      if (wellnessResult.status === 'rejected') {
        console.warn('[coachRatings] Could not load athlete wellness logs', {
          athleteId,
          permissionDenied: isPermissionDenied(wellnessResult.reason),
          error: wellnessResult.reason,
        });
      }

      if (srpeResult.status === 'rejected') {
        console.warn('[coachRatings] Could not load athlete RPE/load logs', {
          athleteId,
          permissionDenied: isPermissionDenied(srpeResult.reason),
          error: srpeResult.reason,
        });
      }

      return { athleteId, wellnessLogs, srpeLogs };
    })
  );

  return buildCoachRatingsDashboardData({
    selectedDate: request.selectedDate,
    viewMode,
    periodStartDate,
    periodEndDate,
    selectedTeamId,
    teamsWithMembers,
    wellnessLogsByAthleteId: new Map(
      athleteLogPairs.map(({ athleteId, wellnessLogs }) => [athleteId, wellnessLogs])
    ),
    srpeLogsByAthleteId: new Map(
      athleteLogPairs.map(({ athleteId, srpeLogs }) => [athleteId, srpeLogs])
    ),
  });
}
