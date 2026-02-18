import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Theme = 'light' | 'dark';

export interface AccentColor {
  id: string;
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
}

export const accentColors: AccentColor[] = [
  // Default - Green to Blue (PixZen Brand)
  { id: 'emerald', name: 'Esmeralda', primary: '160 84% 39%', primaryLight: '160 72% 50%', primaryDark: '200 90% 45%', accent: '174 72% 40%' },
  // Blues
  { id: 'blue', name: 'Azul', primary: '217 91% 50%', primaryLight: '217 91% 60%', primaryDark: '217 91% 40%', accent: '210 90% 55%' },
  { id: 'sky', name: 'Céu', primary: '199 89% 48%', primaryLight: '199 89% 58%', primaryDark: '199 89% 38%', accent: '199 89% 55%' },
  { id: 'cyan', name: 'Ciano', primary: '188 94% 43%', primaryLight: '188 94% 53%', primaryDark: '188 94% 33%', accent: '188 94% 50%' },
  { id: 'teal', name: 'Teal', primary: '173 58% 39%', primaryLight: '173 58% 50%', primaryDark: '173 58% 30%', accent: '173 58% 45%' },
  // Greens
  { id: 'green', name: 'Verde', primary: '142 71% 45%', primaryLight: '142 71% 55%', primaryDark: '142 71% 35%', accent: '142 71% 50%' },
  { id: 'lime', name: 'Lima', primary: '84 85% 42%', primaryLight: '84 85% 52%', primaryDark: '84 85% 32%', accent: '84 85% 48%' },
  // Purples
  { id: 'indigo', name: 'Índigo', primary: '224 71% 40%', primaryLight: '224 71% 55%', primaryDark: '224 71% 30%', accent: '224 71% 50%' },
  { id: 'violet', name: 'Violeta', primary: '262 83% 50%', primaryLight: '262 83% 60%', primaryDark: '262 83% 40%', accent: '262 83% 55%' },
  { id: 'purple', name: 'Roxo', primary: '280 67% 50%', primaryLight: '280 67% 60%', primaryDark: '280 67% 40%', accent: '280 67% 55%' },
  { id: 'fuchsia', name: 'Fúcsia', primary: '292 84% 50%', primaryLight: '292 84% 60%', primaryDark: '292 84% 40%', accent: '292 84% 55%' },
  // Pinks & Reds
  { id: 'pink', name: 'Pink', primary: '330 81% 60%', primaryLight: '330 81% 70%', primaryDark: '330 81% 50%', accent: '330 81% 65%' },
  { id: 'rose', name: 'Rosa', primary: '340 82% 50%', primaryLight: '340 82% 60%', primaryDark: '340 82% 40%', accent: '340 82% 55%' },
  { id: 'red', name: 'Vermelho', primary: '0 72% 51%', primaryLight: '0 72% 61%', primaryDark: '0 72% 41%', accent: '0 72% 56%' },
  // Warm Colors
  { id: 'orange', name: 'Laranja', primary: '24 95% 50%', primaryLight: '24 95% 60%', primaryDark: '24 95% 40%', accent: '24 95% 55%' },
  { id: 'amber', name: 'Âmbar', primary: '38 92% 50%', primaryLight: '38 92% 60%', primaryDark: '38 92% 40%', accent: '38 92% 55%' },
  { id: 'yellow', name: 'Amarelo', primary: '48 96% 53%', primaryLight: '48 96% 63%', primaryDark: '48 96% 43%', accent: '48 96% 58%' },
  // Neutrals
  { id: 'slate', name: 'Ardósia', primary: '215 16% 47%', primaryLight: '215 16% 57%', primaryDark: '215 16% 37%', accent: '215 16% 52%' },
  { id: 'zinc', name: 'Zinco', primary: '240 5% 46%', primaryLight: '240 5% 56%', primaryDark: '240 5% 36%', accent: '240 5% 51%' },
];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default color is emerald (green-blue gradient)
const defaultColor = accentColors[0];

// Helper to get system theme preference
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Get stored theme for a specific user (or system default)
  const getStoredTheme = (uid: string | null): Theme => {
    if (typeof window === 'undefined') return 'light';
    if (uid) {
      const userTheme = localStorage.getItem(`pixzen-theme-${uid}`) as Theme;
      if (userTheme) return userTheme;
    }
    // Fallback: system preference
    return getSystemTheme();
  };

  // Get stored accent for a specific user (or default)
  const getStoredAccent = (uid: string | null): AccentColor => {
    if (typeof window === 'undefined') return defaultColor;
    if (uid) {
      const userAccent = localStorage.getItem(`pixzen-accent-${uid}`);
      if (userAccent) {
        const found = accentColors.find(c => c.id === userAccent);
        if (found) return found;
      }
    }
    // Fallback: default PixZen color
    return defaultColor;
  };

  const [theme, setTheme] = useState<Theme>(() => getStoredTheme(userId));
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => getStoredAccent(userId));

  // When user changes (login/logout), load their preferences
  useEffect(() => {
    const newTheme = getStoredTheme(userId);
    const newAccent = getStoredAccent(userId);
    setTheme(newTheme);
    setAccentColorState(newAccent);
  }, [userId]);

  // Apply theme class to root element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    // Save per-user
    if (userId) {
      localStorage.setItem(`pixzen-theme-${userId}`, theme);
    }
  }, [theme, userId]);

  // Apply CSS variables based on accent color
  useEffect(() => {
    const root = window.document.documentElement;

    // Update CSS variables based on accent color
    if (theme === 'light') {
      root.style.setProperty('--primary', accentColor.primary);
      root.style.setProperty('--ring', accentColor.primary);
      root.style.setProperty('--sidebar-primary', accentColor.primary);
      root.style.setProperty('--accent', accentColor.accent);
      root.style.setProperty('--income', accentColor.primary);
      root.style.setProperty('--success', accentColor.primary);
    } else {
      root.style.setProperty('--primary', accentColor.primaryLight);
      root.style.setProperty('--ring', accentColor.primaryLight);
      root.style.setProperty('--sidebar-primary', accentColor.primaryLight);
      root.style.setProperty('--accent', accentColor.accent);
      root.style.setProperty('--income', accentColor.primaryLight);
      root.style.setProperty('--success', accentColor.primaryLight);
    }

    // Update gradients
    root.style.setProperty(
      '--gradient-primary',
      `linear-gradient(135deg, hsl(${accentColor.primary}), hsl(${accentColor.primaryDark}))`
    );
    root.style.setProperty(
      '--gradient-accent',
      `linear-gradient(135deg, hsl(${accentColor.primary}), hsl(${accentColor.accent}), hsl(${accentColor.primaryDark}))`
    );
    root.style.setProperty(
      '--gradient-hero',
      `linear-gradient(135deg, hsl(${accentColor.primary}) 0%, hsl(${accentColor.accent}) 50%, hsl(${accentColor.primaryDark}) 100%)`
    );
    root.style.setProperty(
      '--shadow-glow',
      `0 0 24px hsl(${accentColor.primary} / 0.2)`
    );
    root.style.setProperty(
      '--shadow-accent',
      `0 0 20px hsl(${accentColor.accent} / 0.2)`
    );

    // Save per-user
    if (userId) {
      localStorage.setItem(`pixzen-accent-${userId}`, accentColor.id);
    }
  }, [accentColor, theme, userId]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
