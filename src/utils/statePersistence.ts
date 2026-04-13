/**
 * State Persistence Utility
 * Handles automatic saving and restoration of application state
 */

interface AppState {
  currentPath: string;
  scrollPosition: number;
  timestamp: number;
  formData?: Record<string, any>;
  lastActivity?: string;
}

const STATE_STORAGE_KEY = 'app_state_v1';
const FORM_DATA_PREFIX = 'form_data_';

export class StatePersistence {
  private static isAutoSaveInitialized = false;
  private static beforeUnloadHandler: (() => void) | null = null;
  private static visibilityHandler: (() => void) | null = null;

  /**
   * Save current application state
   */
  static saveState(additionalData?: Record<string, any>): void {
    try {
      const state: AppState = {
        currentPath: window.location.hash || '#/',
        scrollPosition: window.scrollY || 0,
        timestamp: Date.now(),
        ...additionalData,
      };

      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[StatePersistence] Failed to save state:', error);
    }
  }

  /**
   * Restore saved application state
   */
  static restoreState(): AppState | null {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (!saved) return null;

      const state: AppState = JSON.parse(saved);
      
      // Check if state is recent (within last 24 hours)
      const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000;
      
      if (!isRecent) {
        this.clearState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('[StatePersistence] Failed to restore state:', error);
      return null;
    }
  }

  /**
   * Clear saved state
   */
  static clearState(): void {
    try {
      localStorage.removeItem(STATE_STORAGE_KEY);
    } catch (error) {
      console.error('[StatePersistence] Failed to clear state:', error);
    }
  }

  /**
   * Save form data for a specific form ID
   */
  static saveFormData(formId: string, data: Record<string, any>): void {
    try {
      const key = `${FORM_DATA_PREFIX}${formId}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('[StatePersistence] Failed to save form data:', error);
    }
  }

  /**
   * Restore form data for a specific form ID
   */
  static restoreFormData(formId: string): Record<string, any> | null {
    try {
      const key = `${FORM_DATA_PREFIX}${formId}`;
      const saved = localStorage.getItem(key);
      
      if (!saved) return null;

      const { data, timestamp } = JSON.parse(saved);
      
      // Form data expires after 1 hour
      const isRecent = Date.now() - timestamp < 60 * 60 * 1000;
      
      if (!isRecent) {
        this.clearFormData(formId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[StatePersistence] Failed to restore form data:', error);
      return null;
    }
  }

  /**
   * Clear form data for a specific form ID
   */
  static clearFormData(formId: string): void {
    try {
      const key = `${FORM_DATA_PREFIX}${formId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[StatePersistence] Failed to clear form data:', error);
    }
  }

  /**
   * Initialize auto-save on page navigation
   */
  static initializeAutoSave(): () => void {
    if (this.isAutoSaveInitialized) {
      return () => {
        this.cleanupAutoSave();
      };
    }

    // Save state before page unload
    this.beforeUnloadHandler = () => {
      this.saveState();
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Save state on visibility change (mobile app switching)
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.saveState();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.isAutoSaveInitialized = true;

    return () => {
      this.cleanupAutoSave();
    };
  }

  private static cleanupAutoSave(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    this.isAutoSaveInitialized = false;
  }

  /**
   * Restore scroll position
   */
  static restoreScrollPosition(scrollPosition: number): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  }
}
