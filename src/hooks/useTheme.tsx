import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'default' | 'gold-pink' | 'emerald-mint';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isGoldPink: boolean;
  isInstagram: boolean; // alias for backwards compatibility
  isEmeraldMint: boolean;
}

const THEME_STORAGE_KEY = 'smart_campus_theme_v2';

const defaultThemeContext: ThemeContextType = {
  theme: 'gold-pink',
  setTheme: () => {},
  toggleTheme: () => {},
  isGoldPink: true,
  isInstagram: true,
  isEmeraldMint: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'gold-pink' || saved === 'instagram') {
        return 'gold-pink';
      }
      if (saved === 'emerald-mint') {
        return 'emerald-mint';
      }
      if (saved === 'default') {
        return 'default';
      }
    } catch {
      // LocalStorage access fallback
    }
    return 'gold-pink';
  });

  const applyThemeClasses = (t: AppTheme) => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', t);

    root.classList.remove('theme-gold-pink', 'theme-instagram', 'theme-emerald-mint');
    body.classList.remove('theme-gold-pink', 'theme-instagram', 'theme-emerald-mint');

    if (t === 'gold-pink') {
      root.classList.add('theme-gold-pink');
      body.classList.add('theme-gold-pink');
    } else if (t === 'emerald-mint') {
      root.classList.add('theme-emerald-mint');
      body.classList.add('theme-emerald-mint');
    }
  };

  // Ensure theme classes are applied immediately on mount
  useEffect(() => {
    applyThemeClasses(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage failure
    }
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'gold-pink') return 'emerald-mint';
      if (prev === 'emerald-mint') return 'default';
      return 'gold-pink';
    });
  };

  const isGoldPink = theme === 'gold-pink';
  const isEmeraldMint = theme === 'emerald-mint';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isGoldPink,
        isInstagram: isGoldPink,
        isEmeraldMint,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context || defaultThemeContext;
};
