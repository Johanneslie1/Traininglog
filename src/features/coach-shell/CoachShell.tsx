import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { usePrograms } from '@/context/ProgramsContext';
import {
  COACH_SHELL_PATH,
  readCoachShellTeamId,
  resolveCoachShellTeamId,
  setCoachShellEnabled,
  setCoachShellTeamId,
} from '@/features/coach-shell/coachShellPreference';
import { memberLabel } from '@/features/coach-shell/deskPlan';
import CoachAthleteExport from '@/features/coach-shell/CoachAthleteExport';
import CoachCalendar from '@/features/coach-shell/CoachCalendar';
import CoachPrograms from '@/features/coach-shell/CoachPrograms';
import SessionOverview from '@/features/coach-shell/SessionOverview';
import { listCoachPlacements, type CoachPlacement } from '@/services/coachPlacementService';
import { getCoachTeams, getTeamMembers, type Team, type TeamMember } from '@/services/teamService';
import type { RootState } from '@/store/store';
import { toLocalDateString } from '@/utils/dateUtils';

type DeskScreen = 'calendar' | 'overview' | 'programs' | 'export';

const CoachShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const coachId = useSelector((state: RootState) => state.auth.user?.id ?? '');
  const { programs } = usePrograms();
  const [screen, setScreen] = useState<DeskScreen>('calendar');
  const [linkedDate, setLinkedDate] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<string | null>(() => readCoachShellTeamId());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [placements, setPlacements] = useState<CoachPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const today = toLocalDateString(new Date());
  const selectedTeam = teams.find((team) => team.id === teamId) ?? null;

  useEffect(() => {
    if (location.pathname !== COACH_SHELL_PATH) {
      navigate(COACH_SHELL_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCoachTeams(), listCoachPlacements(coachId)])
      .then(([nextTeams, nextPlacements]) => {
        if (cancelled) return;
        setTeams(nextTeams);
        setPlacements(nextPlacements);
        const nextTeamId = resolveCoachShellTeamId(nextTeams);
        setTeamId(nextTeamId);
        if (nextTeamId) setCoachShellTeamId(nextTeamId);
        setLoadError(null);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load the team. Check your connection and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coachId]);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setMembersLoading(false);
      return;
    }
    let cancelled = false;
    setMembersLoading(true);
    getTeamMembers(teamId)
      .then((nextMembers) => {
        if (cancelled) return;
        const seen = new Set<string>();
        setMembers(nextMembers.filter((member) => {
          if (!member.id || member.status === 'inactive' || seen.has(member.id)) return false;
          seen.add(member.id);
          return true;
        }).sort((a, b) => memberLabel(a).localeCompare(memberLabel(b))));
        setLoadError(null);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load athletes on this team.');
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const reloadPlacements = useCallback(async () => {
    const next = await listCoachPlacements(coachId);
    setPlacements(next);
  }, [coachId]);

  const selectTeam = (nextTeamId: string) => {
    setTeamId(nextTeamId);
    setCoachShellTeamId(nextTeamId);
  };

  const teamPlacements = members.length === 0
    ? []
    : placements.filter((placement) => members.some((member) => member.id === placement.athleteId));

  const openOverview = (date: string) => {
    setLinkedDate(date);
    setScreen('overview');
  };

  const navButton = (id: DeskScreen, label: string) => (
    <button
      type="button"
      aria-current={screen === id ? 'page' : undefined}
      className={`rounded-lg px-3 py-2 text-left text-sm ${screen === id ? 'bg-bg-tertiary font-semibold text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
      onClick={() => {
        if (id === 'overview') setLinkedDate(null);
        setScreen(id);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg-primary text-text-primary md:h-[100dvh] md:flex-row md:overflow-hidden">
      <aside className="flex w-full shrink-0 flex-row flex-wrap items-center gap-2 border-b border-border bg-bg-secondary px-4 py-3 md:h-full md:w-56 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-4 md:py-6">
        <div className="mr-auto md:mr-0">
          <p className="text-xs font-medium text-text-tertiary">TrainingLog</p>
          <h1 className="text-lg font-semibold">Coach workspace</h1>
        </div>
        <label className="w-full min-w-40 text-sm text-text-secondary md:mt-6">
          Team
          {teams.length === 0 ? (
            <p className="mt-1 text-sm text-text-tertiary">No team yet</p>
          ) : teams.length === 1 ? (
            <p className="mt-1 font-medium text-text-primary">{teams[0].name}</p>
          ) : (
            <select
              className="mt-1 w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
              value={teamId ?? ''}
              onChange={(event) => selectTeam(event.target.value)}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          )}
        </label>
        <nav className="flex gap-1 md:mt-4 md:flex-col" aria-label="Coach workspace">
          {navButton('calendar', 'Calendar')}
          {navButton('overview', 'Session overview')}
          {navButton('programs', 'Programs')}
          {navButton('export', 'Export')}
        </nav>
        <div className="md:mt-auto">
          <Button type="button" variant="secondary" size="sm" onClick={() => setCoachShellEnabled(false)}>
            Use the phone app
          </Button>
        </div>
      </aside>
      <div className={screen === 'calendar' ? 'contents' : 'hidden'}>
        <CoachCalendar
          teamName={selectedTeam?.name ?? null}
          members={members}
          placements={teamPlacements}
          programs={programs}
          today={today}
          loading={loading || membersLoading}
          loadError={loadError}
          onChanged={reloadPlacements}
          onOpenOverview={openOverview}
        />
      </div>
      {screen === 'export' && <CoachAthleteExport />}
      {screen === 'programs' && <CoachPrograms />}
      {screen === 'overview' && (
        <SessionOverview
          teamName={selectedTeam?.name ?? null}
          members={members}
          placements={teamPlacements}
          today={today}
          linkedDate={linkedDate}
          loading={loading || membersLoading}
          loadError={loadError}
        />
      )}
    </div>
  );
};

export default CoachShell;
