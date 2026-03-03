import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAthletes, AthleteData } from '@/services/coachService';
import { 
  SearchIcon, 
  UserIcon,
  ClockIcon,
  ExclamationIcon,
  FilterIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

const AthleteList: React.FC = () => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInactive, setFilterInactive] = useState(false);

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    filterAthletesList();
  }, [searchTerm, filterInactive, athletes]);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const fetchedAthletes = await getAllAthletes();
      setAthletes(fetchedAthletes);
    } catch (error) {
      console.error('Error loading athletes:', error);
      toast.error('Failed to load athletes');
    } finally {
      setLoading(false);
    }
  };

  const filterAthletesList = () => {
    let filtered = athletes;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(athlete =>
        `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(term) ||
        athlete.email.toLowerCase().includes(term)
      );
    }

    // Inactive filter (no activity in 7+ days)
    if (filterInactive) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      filtered = filtered.filter(athlete =>
        !athlete.lastActive || new Date(athlete.lastActive) < sevenDaysAgo
      );
    }

    setFilteredAthletes(filtered);
  };

  const getInactiveDays = (lastActive?: string): number | null => {
    if (!lastActive) return null;
    const now = new Date();
    const lastDate = new Date(lastActive);
    const diffMs = now.getTime() - lastDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getTimeAgo = (lastActive?: string): string => {
    if (!lastActive) return 'Never';
    
    const days = getInactiveDays(lastActive);
    if (days === null) return 'Never';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
  };

  const getActivityBadge = (athlete: AthleteData) => {
    const days = getInactiveDays(athlete.lastActive);
    
    if (days === null) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-text-tertiary bg-bg-tertiary border border-border rounded-full px-2 py-1">
          <ClockIcon className="h-3 w-3 mr-1" />
          No activity
        </div>
      );
    }
    
    if (days === 0) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-success-text bg-success-bg border border-success-border rounded-full px-2 py-1">
          <div className="w-2 h-2 bg-success rounded-full mr-1.5"></div>
          Active today
        </div>
      );
    }
    
    if (days >= 7) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-error-text bg-error-bg border border-error-border rounded-full px-2 py-1">
          <ExclamationIcon className="h-3 w-3 mr-1" />
          Inactive {days}d
        </div>
      );
    }
    
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-warning-text bg-warning-bg border border-warning-border rounded-full px-2 py-1">
        <ClockIcon className="h-3 w-3 mr-1" />
        {getTimeAgo(athlete.lastActive)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-text-tertiary">Loading athletes...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search athletes by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterInactive(!filterInactive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterInactive
                ? 'bg-error-bg text-error-text border border-error-border'
                : 'bg-bg-secondary text-text-secondary border border-border hover:border-border-hover'
            }`}
          >
            <FilterIcon className="h-4 w-4" />
            Show Inactive Only (7+ days)
          </button>
          
          <div className="text-sm text-text-tertiary">
            Showing {filteredAthletes.length} of {athletes.length} athletes
          </div>
        </div>
      </div>

      {/* Athletes Grid */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center">
          <UserIcon className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-tertiary">
            {searchTerm || filterInactive
              ? 'No athletes match your filters'
              : 'No athletes in your teams yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAthletes.map((athlete) => (
            <button
              key={athlete.id}
              onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
              className="bg-bg-secondary border border-border hover:border-accent-primary rounded-lg p-4 text-left transition-colors group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-bg-tertiary border border-border rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-primary text-sm font-semibold">
                      {athlete.firstName?.[0]}{athlete.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                      {athlete.firstName} {athlete.lastName}
                    </h3>
                    <p className="text-xs text-text-tertiary">{athlete.email}</p>
                  </div>
                </div>
              </div>

              {/* Activity Badge */}
              <div className="mb-3">
                {getActivityBadge(athlete)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-text-tertiary">7 days</div>
                  <div className="text-text-primary font-semibold">
                    {athlete.workoutsThisWeek || 0} session{athlete.workoutsThisWeek !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary">30 days</div>
                  <div className="text-text-primary font-semibold">
                    {athlete.workoutsThisMonth || 0} session{athlete.workoutsThisMonth !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary">Volume</div>
                  <div className="text-text-primary font-semibold">
                    {athlete.totalVolume ? `${(athlete.totalVolume / 1000).toFixed(1)}k kg` : '0 kg'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AthleteList;
