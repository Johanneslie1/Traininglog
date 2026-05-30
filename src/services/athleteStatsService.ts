import { getAuth } from 'firebase/auth';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { getSrpeByDateRange } from '@/services/srpeService';
import { buildCoachRatingsDashboardData } from '@/services/coachRatingsService';
import { addDays, dateKeyToLocalDate, getLocalWeekDateRange, toLocalDateString } from '@/utils/dateUtils';
import type { CoachRatingsDashboardData, CoachRatingsRequest } from '@/types/coachRatings';
import type { Team } from '@/services/teamService';
import type { WellnessLog } from '@/types/wellness';
import type { SrpeLog } from '@/types/srpe';

export type AthleteStatsRequest = Pick<
  CoachRatingsRequest,
  'selectedDate' | 'viewMode' | 'periodStartDate' | 'periodEndDate'
>;

const PERSONAL_TEAM_ID = 'personal-stats';

function getSignedInAthlete() {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('User must be logged in');
  }

  return user;
}

function splitDisplayName(displayName: string | null | undefined, email: string): { firstName: string; lastName: string } {
  const fallbackName = email || 'You';
  const nameParts = (displayName || fallbackName).trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return { firstName: 'You', lastName: '' };
  }

  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' '),
  };
}

interface SingleAthleteHealthDashboardParams extends AthleteStatsRequest {
  athleteId: string;
  email: string;
  displayName?: string | null;
  wellnessLogs: WellnessLog[];
  srpeLogs: SrpeLog[];
}

export function buildSingleAthleteHealthDashboardData({
  athleteId,
  email,
  displayName,
  wellnessLogs,
  srpeLogs,
  selectedDate,
  viewMode,
  periodStartDate,
  periodEndDate,
}: SingleAthleteHealthDashboardParams): CoachRatingsDashboardData {
  const { firstName, lastName } = splitDisplayName(displayName, email);
  const personalTeam: Team = {
    id: PERSONAL_TEAM_ID,
    name: 'Personal stats',
    description: 'Signed-in athlete only',
    coachId: athleteId,
    coachName: firstName,
    inviteCode: '',
    createdAt: '',
    updatedAt: '',
    isActive: true,
  };

  return buildCoachRatingsDashboardData({
    selectedDate,
    viewMode,
    periodStartDate,
    periodEndDate,
    selectedTeamId: PERSONAL_TEAM_ID,
    teamsWithMembers: [{
      team: personalTeam,
      members: [{
        id: athleteId,
        email,
        firstName,
        lastName,
        status: 'active',
      }],
    }],
    wellnessLogsByAthleteId: new Map([[athleteId, wellnessLogs]]),
    srpeLogsByAthleteId: new Map([[athleteId, srpeLogs]]),
  });
}

export async function getAthleteStatsDashboard(
  request: AthleteStatsRequest
): Promise<CoachRatingsDashboardData> {
  const athlete = getSignedInAthlete();
  const selectedLocalDate = dateKeyToLocalDate(request.selectedDate);
  if (!selectedLocalDate) {
    throw new Error('Invalid selected date. Expected YYYY-MM-DD');
  }

  const weekRange = getLocalWeekDateRange(selectedLocalDate);
  const requestedPeriodStart = request.periodStartDate || weekRange.startDateKey;
  const requestedPeriodEnd = request.periodEndDate || weekRange.endDateKey;
  const periodStartDate = requestedPeriodStart <= requestedPeriodEnd ? requestedPeriodStart : requestedPeriodEnd;
  const periodEndDate = requestedPeriodStart <= requestedPeriodEnd ? requestedPeriodEnd : requestedPeriodStart;
  const periodEndLocalDate = dateKeyToLocalDate(periodEndDate) || weekRange.endDate;
  const wellnessStartDateKey = toLocalDateString(addDays(selectedLocalDate, -28));
  const wellnessEndDateKey = periodEndDate > weekRange.endDateKey ? periodEndDate : weekRange.endDateKey;
  const srpeStartDateKey = toLocalDateString(addDays(periodEndLocalDate, -27));
  const srpeEndDateKey = periodEndDate > weekRange.endDateKey ? periodEndDate : weekRange.endDateKey;

  const [wellnessLogs, srpeLogs] = await Promise.all([
    getWellnessByDateRange(athlete.uid, wellnessStartDateKey, wellnessEndDateKey),
    getSrpeByDateRange(athlete.uid, srpeStartDateKey, srpeEndDateKey),
  ]);

  return buildSingleAthleteHealthDashboardData({
    athleteId: athlete.uid,
    email: athlete.email || '',
    displayName: athlete.displayName,
    wellnessLogs,
    srpeLogs,
    selectedDate: request.selectedDate,
    viewMode: request.viewMode,
    periodStartDate,
    periodEndDate,
  });
}
