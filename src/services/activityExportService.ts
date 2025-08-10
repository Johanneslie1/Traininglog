import { ActivityType, ActivityLog } from '@/types/activityTypes';

/**
 * Service for exporting activity data in different formats
 */
class ActivityExportService {

  /**
   * Export activity logs to CSV format
   */
  exportToCSV(
    logs: ActivityLog[], 
    activityType?: ActivityType,
    filename?: string
  ): void {
    const filteredLogs = activityType 
      ? logs.filter(log => log.activityType === activityType)
      : logs;

    if (filteredLogs.length === 0) {
      console.warn('No logs to export');
      return;
    }

    const csvData = this.convertLogsToCSV(filteredLogs);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `activity-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export activity logs to JSON format
   */
  exportToJSON(
    logs: ActivityLog[], 
    activityType?: ActivityType,
    filename?: string
  ): void {
    const filteredLogs = activityType 
      ? logs.filter(log => log.activityType === activityType)
      : logs;

    if (filteredLogs.length === 0) {
      console.warn('No logs to export');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: filteredLogs.length,
      activityType: activityType || 'all',
      logs: filteredLogs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `activity-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Convert activity logs to CSV format based on activity type
   */
  private convertLogsToCSV(logs: ActivityLog[]): string {
    const headers: string[] = ['Date', 'Activity Type', 'Activity Name', 'User ID'];
    const rows: string[][] = [];

    logs.forEach(log => {
      switch (log.activityType) {
        case ActivityType.RESISTANCE:
          this.addResistanceLogToCSV(log as any, headers, rows);
          break;
        case ActivityType.SPORT:
          this.addSportLogToCSV(log as any, headers, rows);
          break;
        case ActivityType.STRETCHING:
          this.addStretchingLogToCSV(log as any, headers, rows);
          break;
        case ActivityType.ENDURANCE:
          this.addEnduranceLogToCSV(log as any, headers, rows);
          break;
        case ActivityType.OTHER:
          this.addOtherLogToCSV(log as any, headers, rows);
          break;
      }
    });

    // Remove duplicate headers and create CSV
    const uniqueHeaders = [...new Set(headers)];
    const csvRows = [
      uniqueHeaders.join(','),
      ...rows.map(row => {
        // Ensure row has same length as headers
        const normalizedRow = new Array(uniqueHeaders.length).fill('');
        row.forEach((value, index) => {
          if (index < normalizedRow.length) {
            normalizedRow[index] = `"${String(value).replace(/"/g, '""')}"`;
          }
        });
        return normalizedRow.join(',');
      })
    ];

    return csvRows.join('\n');
  }

  private addResistanceLogToCSV(log: any, headers: string[], rows: string[][]): void {
    // Add resistance-specific headers
    const resistanceHeaders = ['Set Number', 'Weight', 'Reps', 'RPE', 'Rest Time', 'Notes'];
    resistanceHeaders.forEach(header => {
      if (!headers.includes(header)) headers.push(header);
    });

    log.sets.forEach((set: any) => {
      const row = [
        log.timestamp.toISOString().split('T')[0],
        log.activityType,
        log.activityName,
        log.userId,
        set.setNumber?.toString() || '',
        set.weight?.toString() || '',
        set.reps?.toString() || '',
        set.rpe?.toString() || '',
        set.restTime?.toString() || '',
        set.notes || ''
      ];
      rows.push(row);
    });
  }

  private addSportLogToCSV(log: any, headers: string[], rows: string[][]): void {
    const sportHeaders = ['Session Number', 'Duration', 'Intensity', 'Score', 'Opponent', 'Performance'];
    sportHeaders.forEach(header => {
      if (!headers.includes(header)) headers.push(header);
    });

    log.sessions.forEach((session: any) => {
      const row = [
        log.timestamp.toISOString().split('T')[0],
        log.activityType,
        log.activityName,
        log.userId,
        session.sessionNumber?.toString() || '',
        session.duration?.toString() || '',
        session.intensity?.toString() || '',
        session.score || '',
        session.opponent || '',
        session.performance?.toString() || ''
      ];
      rows.push(row);
    });
  }

  private addStretchingLogToCSV(log: any, headers: string[], rows: string[][]): void {
    const stretchingHeaders = ['Set Number', 'Duration', 'Hold Time', 'Intensity', 'Flexibility'];
    stretchingHeaders.forEach(header => {
      if (!headers.includes(header)) headers.push(header);
    });

    log.stretches.forEach((stretch: any) => {
      const row = [
        log.timestamp.toISOString().split('T')[0],
        log.activityType,
        log.activityName,
        log.userId,
        stretch.setNumber?.toString() || '',
        stretch.duration?.toString() || '',
        stretch.holdTime?.toString() || '',
        stretch.intensity?.toString() || '',
        stretch.flexibility?.toString() || ''
      ];
      rows.push(row);
    });
  }

  private addEnduranceLogToCSV(log: any, headers: string[], rows: string[][]): void {
    const enduranceHeaders = ['Session Number', 'Distance', 'Duration', 'Pace', 'Avg HR', 'Max HR', 'Calories', 'Elevation'];
    enduranceHeaders.forEach(header => {
      if (!headers.includes(header)) headers.push(header);
    });

    log.sessions.forEach((session: any) => {
      const row = [
        log.timestamp.toISOString().split('T')[0],
        log.activityType,
        log.activityName,
        log.userId,
        session.sessionNumber?.toString() || '',
        session.distance?.toString() || '',
        session.duration?.toString() || '',
        session.pace?.toString() || '',
        session.averageHeartRate?.toString() || '',
        session.maxHeartRate?.toString() || '',
        session.calories?.toString() || '',
        session.elevation?.toString() || ''
      ];
      rows.push(row);
    });
  }

  private addOtherLogToCSV(log: any, headers: string[], rows: string[][]): void {
    // For other activities, we need to handle dynamic custom fields
    log.customData.forEach((data: any) => {
      // Add custom field headers
      Object.keys(data.customValues || {}).forEach(key => {
        const headerName = `Custom_${key}`;
        if (!headers.includes(headerName)) headers.push(headerName);
      });

      const row = [
        log.timestamp.toISOString().split('T')[0],
        log.activityType,
        log.activityName,
        log.userId
      ];

      // Add custom field values
      Object.values(data.customValues || {}).forEach(value => {
        row.push(String(value));
      });

      rows.push(row);
    });
  }

  /**
   * Export activity statistics
   */
  exportActivityStats(
    logs: ActivityLog[],
    filename?: string
  ): void {
    const stats = this.calculateActivityStats(logs);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      statistics: stats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `activity-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Calculate statistics across all activity types
   */
  private calculateActivityStats(logs: ActivityLog[]) {
    const statsByType: { [key in ActivityType]?: any } = {};

    // Group logs by activity type
    const logsByType = logs.reduce((acc, log) => {
      if (!acc[log.activityType]) {
        acc[log.activityType] = [];
      }
      acc[log.activityType].push(log);
      return acc;
    }, {} as { [key in ActivityType]: ActivityLog[] });

    // Calculate stats for each activity type
    Object.entries(logsByType).forEach(([type, typeLogs]) => {
      const activityType = type as ActivityType;
      
      switch (activityType) {
        case ActivityType.RESISTANCE:
          statsByType[activityType] = this.calculateResistanceStats(typeLogs as any[]);
          break;
        case ActivityType.SPORT:
          statsByType[activityType] = this.calculateSportStats(typeLogs as any[]);
          break;
        case ActivityType.STRETCHING:
          statsByType[activityType] = this.calculateStretchingStats(typeLogs as any[]);
          break;
        case ActivityType.ENDURANCE:
          statsByType[activityType] = this.calculateEnduranceStats(typeLogs as any[]);
          break;
        case ActivityType.OTHER:
          statsByType[activityType] = this.calculateOtherStats(typeLogs as any[]);
          break;
      }
    });

    return {
      overview: {
        totalLogs: logs.length,
        activitiesByType: Object.keys(logsByType).reduce((acc, type) => {
          acc[type] = logsByType[type as ActivityType].length;
          return acc;
        }, {} as { [key: string]: number }),
        dateRange: {
          start: Math.min(...logs.map(log => log.timestamp.getTime())),
          end: Math.max(...logs.map(log => log.timestamp.getTime()))
        }
      },
      byActivityType: statsByType
    };
  }

  private calculateResistanceStats(logs: any[]) {
    const totalSets = logs.reduce((sum, log) => sum + log.sets.length, 0);
    const totalVolume = logs.reduce((sum, log) => 
      sum + log.sets.reduce((setSum: number, set: any) => 
        setSum + (set.weight || 0) * (set.reps || 0), 0), 0);
    
    return {
      totalWorkouts: logs.length,
      totalSets,
      totalVolume,
      averageSetsPerWorkout: totalSets / logs.length,
      averageVolumePerWorkout: totalVolume / logs.length
    };
  }

  private calculateSportStats(logs: any[]) {
    const totalSessions = logs.reduce((sum, log) => sum + log.sessions.length, 0);
    const totalDuration = logs.reduce((sum, log) => 
      sum + log.sessions.reduce((sessionSum: number, session: any) => 
        sessionSum + (session.duration || 0), 0), 0);
    
    return {
      totalSportActivities: logs.length,
      totalSessions,
      totalDuration,
      averageDurationPerSession: totalDuration / totalSessions
    };
  }

  private calculateStretchingStats(logs: any[]) {
    const totalSets = logs.reduce((sum, log) => sum + log.stretches.length, 0);
    const totalDuration = logs.reduce((sum, log) => 
      sum + log.stretches.reduce((stretchSum: number, stretch: any) => 
        stretchSum + (stretch.duration || 0), 0), 0);
    
    return {
      totalStretchingSessions: logs.length,
      totalSets,
      totalDuration,
      averageDurationPerSet: totalDuration / totalSets
    };
  }

  private calculateEnduranceStats(logs: any[]) {
    const totalSessions = logs.reduce((sum, log) => sum + log.sessions.length, 0);
    const totalDistance = logs.reduce((sum, log) => 
      sum + log.sessions.reduce((sessionSum: number, session: any) => 
        sessionSum + (session.distance || 0), 0), 0);
    const totalDuration = logs.reduce((sum, log) => 
      sum + log.sessions.reduce((sessionSum: number, session: any) => 
        sessionSum + (session.duration || 0), 0), 0);
    
    return {
      totalEnduranceActivities: logs.length,
      totalSessions,
      totalDistance,
      totalDuration,
      averageDistancePerSession: totalDistance / totalSessions,
      averageDurationPerSession: totalDuration / totalSessions
    };
  }

  private calculateOtherStats(logs: any[]) {
    const totalSessions = logs.reduce((sum, log) => sum + log.customData.length, 0);
    
    return {
      totalOtherActivities: logs.length,
      totalSessions,
      averageSessionsPerActivity: totalSessions / logs.length
    };
  }
}

// Export service instance
export const activityExportService = new ActivityExportService();
