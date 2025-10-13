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
      console.log('[StatePersistence] State saved:', state.currentPath);
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
        console.log('[StatePersistence] State expired, clearing');
        this.clearState();
        return null;
      }

      console.log('[StatePersistence] State restored:', state.currentPath);
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
      console.log('[StatePersistence] State cleared');
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
      console.log(`[StatePersistence] Form data saved for ${formId}`);
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

      console.log(`[StatePersistence] Form data restored for ${formId}`);
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
      console.log(`[StatePersistence] Form data cleared for ${formId}`);
    } catch (error) {
      console.error('[StatePersistence] Failed to clear form data:', error);
    }
  }

  /**
   * Initialize auto-save on page navigation
   */
  static initializeAutoSave(): void {
    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });

    // Save state on visibility change (mobile app switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveState();
      }
    });

    // Save state on hash change (navigation)
    window.addEventListener('hashchange', () => {
      this.saveState();
    });

    console.log('[StatePersistence] Auto-save initialized');
  }

  /**
   * Restore scroll position
   */
  static restoreScrollPosition(scrollPosition: number): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
      console.log('[StatePersistence] Scroll position restored:', scrollPosition);
    }, 100);
  }
}
