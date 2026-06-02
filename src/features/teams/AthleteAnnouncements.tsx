import React, { useEffect, useMemo, useState } from 'react';
import { ChatAltIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getAnnouncementsForAthlete } from '@/services/announcementService';
import { EmptyState, LoadingState, StatusBadge } from '@/components/ui';
import { formatDisplayDateTime } from '@/utils/displayFormatters';

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
      <LoadingState label="Loading announcements..." className="py-10" />
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary mb-1">Coach Announcements</h2>
      <p className="text-sm text-text-tertiary mb-5">Read-only messages sent by your coach</p>

      {sortedItems.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
          <EmptyState
            icon={<ChatAltIcon className="h-10 w-10" />}
            title="No announcements yet"
            description="Coach announcements will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div key={item.id} className="bg-bg-secondary border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ChatAltIcon className="h-5 w-5 text-primary-400 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge label={item.source} tone="info" className="uppercase tracking-wide" />
                    <span className="text-sm text-text-secondary">{item.title}</span>
                  </div>
                  <p className="text-text-primary whitespace-pre-wrap">{item.message}</p>
                  <div className="text-xs text-text-muted mt-2">
                    {item.coachName} • {formatDisplayDateTime(item.timestamp)}
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
