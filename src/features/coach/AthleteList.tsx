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
        <div className="flex items-center text-xs text-gray-500">
          <ClockIcon className="h-3 w-3 mr-1" />
          No activity
        </div>
      );
    }
    
    if (days === 0) {
      return (
        <div className="flex items-center text-xs text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
          Active today
        </div>
      );
    }
    
    if (days >= 7) {
      return (
        <div className="flex items-center text-xs text-red-400">
          <ExclamationIcon className="h-3 w-3 mr-1" />
          Inactive {days}d
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-xs text-yellow-400">
        <ClockIcon className="h-3 w-3 mr-1" />
        {getTimeAgo(athlete.lastActive)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-400">Loading athletes...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search athletes by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterInactive(!filterInactive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterInactive
                ? 'bg-red-900/30 text-red-400 border border-red-700/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            <FilterIcon className="h-4 w-4" />
            Show Inactive Only (7+ days)
          </button>
          
          <div className="text-sm text-gray-500">
            Showing {filteredAthletes.length} of {athletes.length} athletes
          </div>
        </div>
      </div>

      {/* Athletes Grid */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <UserIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
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
              className="bg-gray-900 border border-gray-800 hover:border-primary-600 rounded-lg p-5 text-left transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-400 text-lg font-bold">
                      {athlete.firstName?.[0]}{athlete.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {athlete.firstName} {athlete.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">{athlete.email}</p>
                  </div>
                </div>
              </div>

              {/* Activity Badge */}
              <div className="mb-3">
                {getActivityBadge(athlete)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">This Week</div>
                  <div className="text-white font-semibold">
                    {athlete.workoutsThisWeek || 0} workout{athlete.workoutsThisWeek !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">This Month</div>
                  <div className="text-white font-semibold">
                    {athlete.workoutsThisMonth || 0} workout{athlete.workoutsThisMonth !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Volume</div>
                  <div className="text-white font-semibold">
                    {athlete.totalVolume ? `${(athlete.totalVolume / 1000).toFixed(1)}k kg` : '0 kg'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Programs</div>
                  <div className="text-white font-semibold">
                    {athlete.programsCompleted || 0}/{athlete.programsAssigned || 0}
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
