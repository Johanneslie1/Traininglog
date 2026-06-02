import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const THEME_META_COLORS: Record<ActualTheme, string> = {
  dark: '#011c40',
  light: '#f7fcfd',
};

const THEME_COLOR_SCHEMES: Record<ActualTheme, string> = {
  dark: 'dark',
  light: 'only light',
};

const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

const getSystemTheme = (): ActualTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolveTheme = (theme: Theme): ActualTheme =>
  theme === 'system' ? getSystemTheme() : theme;

const getSavedTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : 'dark';
  } catch {
    return 'dark';
  }
};

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme);

  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => resolveTheme(getSavedTheme()));

  useEffect(() => {
    const updateTheme = () => {
      const newActualTheme = resolveTheme(theme);
      
      setActualTheme(newActualTheme);
      
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newActualTheme);
      root.dataset.theme = newActualTheme;
      root.dataset.themePreference = theme;
      root.style.colorScheme = THEME_COLOR_SCHEMES[newActualTheme];
      
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', THEME_META_COLORS[newActualTheme]);
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage failures in restricted browsing contexts.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
