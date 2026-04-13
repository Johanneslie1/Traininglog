import React, { useEffect, useMemo, useState } from 'react';
import { ChatAltIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getAnnouncementsForAthlete } from '@/services/announcementService';

interface AnnouncementItem {
  id: string;
  source: 'announcement';
  title: string;
  coachName: string;
  message: string;
  timestamp: string;
}

const AthleteAnnouncements: React.FC = () => {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        const dedicatedAnnouncements = await getAnnouncementsForAthlete();

        const coachAnnouncements: AnnouncementItem[] = dedicatedAnnouncements.map((item) => ({
          id: `announcement-${item.id}`,
          source: 'announcement',
          title: 'Coach Announcement',
          coachName: item.createdByName || 'Coach',
          message: item.message,
          timestamp: item.createdAt
        }));

        setItems(coachAnnouncements);
      } catch (error) {
        console.error('Error loading athlete announcements:', error);
        toast.error('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [items]
  );

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-white">Loading announcements...</span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Coach Announcements</h2>
      <p className="text-sm text-gray-400 mb-5">Read-only messages sent by your coach</p>

      {sortedItems.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center text-gray-400">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div key={item.id} className="bg-bg-secondary border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ChatAltIcon className="h-5 w-5 text-primary-400 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-900/30 text-primary-300 uppercase tracking-wide">
                      {item.source}
                    </span>
                    <span className="text-sm text-gray-300">{item.title}</span>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{item.message}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {item.coachName} • {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AthleteAnnouncements;
