import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { getAllAthletes } from '@/services/coachService';
import { downloadPowerBiZip } from '@/services/powerBiExportService';
import { getCoachTeams, type Team } from '@/services/teamService';
import type { RootState } from '@/store/store';
import type { PowerBiExportScope } from '@/types/powerBiExport';

type ExportPreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'allTime' | 'custom';

const SCOPES: Array<{ key: PowerBiExportScope; label: string }> = [
  { key: 'self', label: 'My own data' },
  { key: 'athlete', label: 'One athlete' },
  { key: 'athletes', label: 'Selected athletes' },
  { key: 'team', label: 'One team' },
  { key: 'allCoachAthletes', label: 'All athletes I coach' },
];

function presetRange(preset: ExportPreset): { from?: string; to?: string } {
  const now = new Date();
  const key = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  if (preset === 'allTime' || preset === 'custom') return {};
  if (preset === 'last7days') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { from: key(start), to: key(now) };
  }
  if (preset === 'last30days') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return { from: key(start), to: key(now) };
  }
  if (preset === 'thisMonth') {
    return { from: key(new Date(now.getFullYear(), now.getMonth(), 1)), to: key(now) };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: key(start), to: key(end) };
}

const CoachAthleteExport: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [scope, setScope] = useState<PowerBiExportScope>('athlete');
  const [athletes, setAthletes] = useState<Array<{ id: string; name: string }>>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [athleteId, setAthleteId] = useState('');
  const [athleteIds, setAthleteIds] = useState<string[]>([]);
  const [teamId, setTeamId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [preset, setPreset] = useState<ExportPreset>('allTime');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    Promise.all([getAllAthletes(), getCoachTeams()])
      .then(([people, coachTeams]) => {
        if (cancelled) return;
        const mapped = people.map((person) => ({
          id: person.id,
          name: [person.firstName, person.lastName].filter(Boolean).join(' ') || person.email || person.id,
        }));
        setAthletes(mapped);
        setAthleteId((current) => current || mapped[0]?.id || '');
        setAthleteIds((current) => (current.length > 0 ? current : mapped[0] ? [mapped[0].id] : []));
        setTeams(coachTeams);
        setTeamId((current) => current || coachTeams[0]?.id || '');
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load athletes for export.');
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyPreset = (next: ExportPreset) => {
    setPreset(next);
    if (next === 'custom') return;
    const range = presetRange(next);
    setFromDate(range.from ?? '');
    setToDate(range.to ?? '');
  };

  const exportData = async () => {
    if (!user?.id) {
      toast.error('Please log in to export data.');
      return;
    }
    if (scope === 'athlete' && !athleteId) {
      toast.error('Please select an athlete to export.');
      return;
    }
    if (scope === 'athletes' && athleteIds.length === 0) {
      toast.error('Please select at least one athlete to export.');
      return;
    }
    if (scope === 'team' && !teamId) {
      toast.error('Please select a team to export.');
      return;
    }
    const range = preset === 'custom'
      ? { from: fromDate || undefined, to: toDate || undefined }
      : presetRange(preset);
    setExporting(true);
    try {
      const result = await downloadPowerBiZip(
        {
          scope,
          targetAthleteId: scope === 'athlete' ? athleteId : undefined,
          targetAthleteIds: scope === 'athletes' ? athleteIds : undefined,
          targetTeamId: scope === 'team' ? teamId : undefined,
          fromDate: range.from,
          toDate: range.to,
        },
        {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
        }
      );
      toast.success(
        `Export ready. ${result.athleteCount} athlete(s), ${result.sessionCount} sessions, ${result.gymSetCount + result.activityCount} saved sets.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Export failed: ${message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-4 py-5 md:px-8">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold">Export</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Download training for any athlete you coach. Saved sets are included. Empty sets from a session that has not been filled in are left out.
        </p>
      </div>

      <div className="mt-6 max-w-3xl space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">Export scope</p>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={scope === key}
                className={`rounded-lg px-3 py-1.5 text-sm ${scope === key ? 'bg-accent-primary font-semibold text-text-on-accent' : 'bg-bg-tertiary text-text-secondary'}`}
                onClick={() => setScope(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {scope === 'athlete' && (
          <label className="block text-sm text-text-secondary">
            Select athlete
            {loadingOptions ? (
              <p className="mt-2 text-text-secondary">Loading athletes...</p>
            ) : athletes.length === 0 ? (
              <p className="mt-2 text-text-secondary">No athletes found on your teams.</p>
            ) : (
              <select
                value={athleteId}
                onChange={(event) => setAthleteId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary"
              >
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
                ))}
              </select>
            )}
          </label>
        )}

        {scope === 'athletes' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Select athletes</p>
              <button
                type="button"
                className="text-xs text-accent-primary"
                onClick={() => setAthleteIds(athletes.map((athlete) => athlete.id))}
              >
                Select all
              </button>
            </div>
            {loadingOptions ? (
              <p className="text-sm text-text-secondary">Loading athletes...</p>
            ) : (
              <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {athletes.map((athlete) => (
                  <label key={athlete.id} className="flex items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={athleteIds.includes(athlete.id)}
                      onChange={() => setAthleteIds((current) => (
                        current.includes(athlete.id)
                          ? current.filter((id) => id !== athlete.id)
                          : [...current, athlete.id]
                      ))}
                    />
                    {athlete.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {scope === 'team' && (
          <label className="block text-sm text-text-secondary">
            Select team
            {loadingOptions ? (
              <p className="mt-2 text-text-secondary">Loading teams...</p>
            ) : teams.length === 0 ? (
              <p className="mt-2 text-text-secondary">No teams found.</p>
            ) : (
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </label>
        )}

        <div className="space-y-2">
          <p className="text-sm text-text-secondary">Date range</p>
          <div className="flex flex-wrap gap-2">
            {([
              ['last7days', 'Last 7 days'],
              ['last30days', 'Last 30 days'],
              ['thisMonth', 'This month'],
              ['lastMonth', 'Last month'],
              ['allTime', 'All time'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={preset === key}
                className={`rounded-lg px-3 py-1.5 text-sm ${preset === key ? 'bg-accent-primary font-semibold text-text-on-accent' : 'bg-bg-tertiary text-text-secondary'}`}
                onClick={() => applyPreset(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-text-secondary">
              From date
              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setPreset('custom');
                  setFromDate(event.target.value);
                }}
                className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary"
              />
            </label>
            <label className="text-sm text-text-secondary">
              To date
              <input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setPreset('custom');
                  setToDate(event.target.value);
                }}
                className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary"
              />
            </label>
          </div>
        </div>

        <Button
          type="button"
          fullWidth
          isLoading={exporting}
          disabled={
            exporting
            || !user?.id
            || (scope === 'athlete' && !athleteId)
            || (scope === 'athletes' && athleteIds.length === 0)
            || (scope === 'team' && !teamId)
          }
          onClick={() => { void exportData(); }}
        >
          Export data
        </Button>
        <p className="text-sm text-text-secondary">
          Same Power BI file as Settings: sessions, saved gym sets, activities, wellness, and sports load for the athletes you already coach.
        </p>
      </div>
    </section>
  );
};

export default CoachAthleteExport;
