import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardListIcon, ClipboardCheckIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getSharedPrograms } from '@/services/programService';
import { getSharedSessionsForAthlete } from '@/services/sessionService';

interface ActivityItem {
  id: string;
  type: 'program' | 'session';
  title: string;
  status: string;
  timestamp: string;
}

const AthleteActivityFeed: React.FC = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const [programAssignments, sessionAssignments] = await Promise.all([
          getSharedPrograms(),
          getSharedSessionsForAthlete()
        ]);

        const programItems: ActivityItem[] = programAssignments.map((item: any) => ({
          id: `program-${item.assignmentId || item.id}`,
          type: 'program',
          title: item.originalProgram?.name || 'Assigned Program',
          status: item.assignmentStatus || 'not-started',
          timestamp: item.assignedAt
        }));

        const sessionItems: ActivityItem[] = sessionAssignments.map((item) => ({
          id: `session-${item.id}`,
          type: 'session',
          title: item.sessionData?.name || 'Assigned Session',
          status: item.status,
          timestamp: item.lastViewedAt || item.assignedAt
        }));

        setItems([...programItems, ...sessionItems]);
      } catch (error) {
        console.error('Error loading athlete activity feed:', error);
        toast.error('Failed to load activity feed');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [items]
  );

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-white">Loading activity...</span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Activity Feed</h2>
      <p className="text-sm text-gray-400 mb-5">Program and session assignment updates</p>

      {sortedItems.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center text-gray-400">
          No activity yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div key={item.id} className="bg-bg-secondary border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center">
                  {item.type === 'program' ? (
                    <ClipboardListIcon className="h-5 w-5 text-blue-400" />
                  ) : (
                    <ClipboardCheckIcon className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-sm text-gray-400 capitalize">Status: {item.status.replace('-', ' ')}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AthleteActivityFeed;
