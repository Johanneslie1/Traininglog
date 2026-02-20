import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCoachTeams, Team } from '@/services/teamService';
import { getAllAthletes, AthleteData } from '@/services/coachService';
import { createCoachAnnouncement, getCoachAnnouncements } from '@/services/announcementService';
import { CoachAnnouncement } from '@/types/announcement';

const CoachAnnouncementsPanel: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [sentAnnouncements, setSentAnnouncements] = useState<CoachAnnouncement[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedAthleteCount = useMemo(() => {
    return new Set(selectedAthleteIds).size;
  }, [selectedAthleteIds]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coachTeams, allAthletes, announcements] = await Promise.all([
        getCoachTeams(),
        getAllAthletes(),
        getCoachAnnouncements()
      ]);

      setTeams(coachTeams);
      setAthletes(allAthletes);
      setSentAnnouncements(announcements);
    } catch (error) {
      console.error('Error loading coach announcements data:', error);
      toast.error('Failed to load announcements data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const toggleAthlete = (athleteId: string) => {
    setSelectedAthleteIds((prev) =>
      prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId]
    );
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Add a message before sending');
      return;
    }

    if (selectedTeamIds.length === 0 && selectedAthleteIds.length === 0) {
      toast.error('Select at least one team or athlete');
      return;
    }

    try {
      setSubmitting(true);
      await createCoachAnnouncement({
        message: message.trim(),
        targetTeamIds: selectedTeamIds,
        targetAthleteIds: selectedAthleteIds
      });

      setMessage('');
      setSelectedTeamIds([]);
      setSelectedAthleteIds([]);
      toast.success('Announcement sent');
      const announcements = await getCoachAnnouncements();
      setSentAnnouncements(announcements);
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send announcement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Announcements</h2>
        <p className="text-sm text-gray-400">Send announcements to one or more teams and/or selected athletes.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <div>
          <label htmlFor="announcement-message" className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            id="announcement-message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 500))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Write your announcement..."
          />
          <div className="mt-1 text-xs text-gray-500">{message.length}/500 characters</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Teams</h3>
              <button
                type="button"
                onClick={() => setSelectedTeamIds(teams.map((team) => team.id))}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Select all
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {teams.length === 0 && <div className="text-sm text-gray-500">No teams found</div>}
              {teams.map((team) => (
                <label key={team.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                    className="rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{team.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Athletes</h3>
              <button
                type="button"
                onClick={() => setSelectedAthleteIds(athletes.map((athlete) => athlete.id))}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Select all
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {athletes.length === 0 && <div className="text-sm text-gray-500">No athletes found</div>}
              {athletes.map((athlete) => (
                <label key={athlete.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedAthleteIds.includes(athlete.id)}
                    onChange={() => toggleAthlete(athlete.id)}
                    className="rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{athlete.firstName} {athlete.lastName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <div className="text-sm text-gray-400">
            Selected: {selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''}, {selectedAthleteCount} athlete{selectedAthleteCount !== 1 ? 's' : ''}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            {submitting ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-3">Recent Announcements</h3>
        {sentAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-500">No announcements sent yet.</p>
        ) : (
          <div className="space-y-3">
            {sentAnnouncements.slice(0, 10).map((item) => (
              <div key={item.id} className="border border-gray-800 rounded-lg p-3">
                <p className="text-white whitespace-pre-wrap">{item.message}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.createdAt).toLocaleString()} • {item.recipientUserIds.length} recipient{item.recipientUserIds.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachAnnouncementsPanel;
