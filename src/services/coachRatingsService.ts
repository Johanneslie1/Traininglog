import { getAuth } from 'firebase/auth';
import { getCoachTeams, getTeamMembers, syncCoachAthleteAccess } from '@/services/teamService';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { getSrpeByDateRange } from '@/services/srpeService';
import { getLocalWeekDateRange, dateKeyToLocalDate } from '@/utils/dateUtils';
import { SrpeLog } from '@/types/srpe';
import { WellnessLog, WELLNESS_METRICS, WellnessMetricKey } from '@/types/wellness';
import {
  CoachDailySrpeSummary,
  CoachDailyWellnessSummary,
  CoachRatingStatus,
  CoachRatingsDashboardData,
  CoachRatingsRequest,
  CoachRatingsRow,
  CoachRatingsSummary,
  CoachRatingsTeamInput,
  CoachRatingsTeamOption,
  CoachWeeklySrpeSummary,
  CoachWeeklyWellnessSummary,
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

function buildSummary(rows: CoachRatingsRow[]): CoachRatingsSummary {
  if (rows.length === 0) return EMPTY_SUMMARY;

  return {
    athleteCount: rows.length,
    dailyWellnessAverage: nullableRoundedAverage(rows.map((row) => row.dailyWellness.score)),
    weeklyWellnessAverage: nullableRoundedAverage(rows.map((row) => row.weeklyWellness.average)),
    weeklyWellnessTotal: roundOne(rows.reduce((sum, row) => sum + row.weeklyWellness.total, 0)),
    dailySrpeAverage: nullableRoundedAverage(rows.map((row) => row.dailySrpe.rpe)),
    dailySrpeTotalLoad: rows.reduce((sum, row) => sum + (row.dailySrpe.sessionLoad || 0), 0),
    weeklySrpeAverage: nullableRoundedAverage(rows.map((row) => row.weeklySrpe.averageRpe)),
    weeklySrpeTotalLoad: rows.reduce((sum, row) => sum + row.weeklySrpe.totalLoad, 0),
    missingDailyWellnessCount: rows.filter((row) => row.missingDailyWellness).length,
    missingDailySrpeCount: rows.filter((row) => row.missingDailySrpe).length,
    outlierCount: rows.filter((row) => row.status === 'outlier').length,
  };
}

function nullableRoundedAverage(values: Array<number | null>): number | null {
  const presentValues = values.filter((value): value is number => value !== null);
  const value = average(presentValues);
  return value === null ? null : roundOne(value);
}

function classifyRows(rows: CoachRatingsRow[]): CoachRatingsRow[] {
  const dailyWellnessAverage = nullableRoundedAverage(rows.map((row) => row.dailyWellness.score));
  const weeklyWellnessAverage = nullableRoundedAverage(rows.map((row) => row.weeklyWellness.average));
  const weeklyLoadAverage = nullableRoundedAverage(rows.map((row) => row.weeklySrpe.totalLoad));

  return rows.map((row) => {
    const outlierReasons: string[] = [];
    const watchReasons: string[] = [];

    if (row.dailyWellness.score !== null) {
      if (row.dailyWellness.score < 4) {
        outlierReasons.push('Low daily wellness');
      } else if (row.dailyWellness.score < 5) {
        watchReasons.push('Daily wellness needs attention');
      }

      if (dailyWellnessAverage !== null && row.dailyWellness.score <= dailyWellnessAverage - 1.5) {
        outlierReasons.push('Daily wellness below team average');
      } else if (dailyWellnessAverage !== null && row.dailyWellness.score <= dailyWellnessAverage - 0.8) {
        watchReasons.push('Daily wellness below team average');
      }
    }

    if (row.weeklyWellness.average !== null) {
      if (row.weeklyWellness.average < 4) {
        outlierReasons.push('Low weekly wellness');
      } else if (row.weeklyWellness.average < 5) {
        watchReasons.push('Weekly wellness needs attention');
      }

      if (weeklyWellnessAverage !== null && row.weeklyWellness.average <= weeklyWellnessAverage - 1.2) {
        outlierReasons.push('Weekly wellness below team average');
      }
    }

    row.dailyWellness.metrics.forEach((metric) => {
      if (metric.status === 'outlier') {
        outlierReasons.push(`${metric.label} red flag`);
      } else if (metric.status === 'watch') {
        watchReasons.push(`${metric.label} watch`);
      }
    });

    if (row.dailySrpe.rpe !== null) {
      if (row.dailySrpe.rpe >= 9) {
        outlierReasons.push('Very high daily sRPE');
      } else if (row.dailySrpe.rpe >= 8) {
        watchReasons.push('High daily sRPE');
      }
    }

    if (weeklyLoadAverage !== null && weeklyLoadAverage > 0 && row.weeklySrpe.totalLoad > 0) {
      if (row.weeklySrpe.totalLoad >= weeklyLoadAverage * 1.5) {
        outlierReasons.push('Weekly sRPE load above team average');
      } else if (row.weeklySrpe.totalLoad >= weeklyLoadAverage * 1.25) {
        watchReasons.push('Weekly sRPE load above team average');
      }
    }

    if (row.missingDailyWellness) {
      watchReasons.push('Missing daily wellness');
    }

    if (row.missingDailySrpe) {
      watchReasons.push('Missing daily sRPE');
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
  const selectedTeamId = params.selectedTeamId || null;
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

  const rows = Array.from(athleteMap.values())
    .map((athlete) => {
      const wellnessLogs = params.wellnessLogsByAthleteId.get(athlete.athleteId) || [];
      const srpeLogs = params.srpeLogsByAthleteId.get(athlete.athleteId) || [];
      const dailyWellnessLog = wellnessLogs.find((log) => log.date === params.selectedDate) || null;
      const dailySrpeLog = srpeLogs.find((log) => log.date === params.selectedDate) || null;
      const dailyWellness = summarizeDailyWellness(dailyWellnessLog);
      const dailySrpe = summarizeDailySrpe(dailySrpeLog);

      return {
        athleteId: athlete.athleteId,
        athleteName: athlete.athleteName,
        email: athlete.email,
        teamIds: Array.from(athlete.teamIds),
        teamNames: Array.from(athlete.teamNames),
        dailyWellness,
        weeklyWellness: summarizeWeeklyWellness(wellnessLogs),
        dailySrpe,
        weeklySrpe: summarizeWeeklySrpe(srpeLogs),
        status: 'good' as CoachRatingStatus,
        outlierReasons: [],
        missingDailyWellness: !dailyWellness.submitted,
        missingDailySrpe: !dailySrpe.submitted,
      };
    })
    .sort((a, b) => a.athleteName.localeCompare(b.athleteName));

  const classifiedRows = classifyRows(rows);
  const summary = buildSummary(classifiedRows);
  const teamOptions: CoachRatingsTeamOption[] = params.teamsWithMembers.map(({ team, members }) => ({
    id: team.id,
    name: team.name,
    athleteCount: members.filter((member) => member.status !== 'inactive').length,
  }));

  return {
    selectedDate: params.selectedDate,
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
        getWellnessByDateRange(athleteId, weekRange.startDateKey, weekRange.endDateKey),
        getSrpeByDateRange(athleteId, weekRange.startDateKey, weekRange.endDateKey),
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
        console.warn('[coachRatings] Could not load athlete sRPE logs', {
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
