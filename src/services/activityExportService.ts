import { ActivityType, ActivityLog } from '@/types/activityTypes';

// Minimal stub implementation (rewritten due to previous file corruption issues)
// Expand later if advanced export features are required.
class ActivityExportService {
  exportToCSV(_logs: ActivityLog[], _activityType?: ActivityType, _filename?: string) {
    console.warn('CSV export not implemented (stub).');
  }
  exportToJSON(_logs: ActivityLog[], _activityType?: ActivityType, _filename?: string) {
    console.warn('JSON export not implemented (stub).');
  }
  exportActivityStats(_logs: ActivityLog[], _filename?: string) {
    console.warn('Stats export not implemented (stub).');
  }
}

export const activityExportService = new ActivityExportService();
