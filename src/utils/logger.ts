/**
 * Centralized logging utility for the app
 * Provides environment-aware logging with consistent formatting
 */

const isDev = import.meta.env.MODE !== 'production';
const SILENT = false; // Set to true to disable all logs

export const logger = {
  debug: (...args: any[]) => {
    if (isDev && !SILENT) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (!SILENT) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!SILENT) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (!SILENT) {
      console.error('[ERROR]', ...args);
    }
  },
  
  trace: (obj: any, label = 'Object') => {
    if (isDev && !SILENT) {
      console.group(`[TRACE] ${label}`);
      console.table(obj);
      console.groupEnd();
    }
  },
  
  // For high-frequency logs that can be easily toggled off
  verbose: (...args: any[]) => {
    if (isDev && !SILENT && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
      console.debug('[VERBOSE]', ...args);
    }
  }
};

// Helper to log only object IDs/lengths instead of full objects
export const logSummary = (obj: any, type = 'object'): string => {
  if (Array.isArray(obj)) {
    return `${type}[${obj.length}]`;
  }
  if (obj && typeof obj === 'object') {
    if (obj.id) return `${type}(${obj.id})`;
    if (obj.name) return `${type}(${obj.name})`;
    return `${type}(${Object.keys(obj).length} keys)`;
  }
  return String(obj);
};
