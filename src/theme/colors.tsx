import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReasonTag } from '../types/snack';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  danger: string;
  reasonColors: Record<ReasonTag, string>;
  reasonColorsMuted: Record<ReasonTag, string>;
  untaggedColor: string;
}

export const lightColors: ThemeColors = {
  background: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEBE2',
  textPrimary: '#2B2A27',
  textSecondary: '#716C61',
  textMuted: '#A39D8F',
  border: '#E4DFD3',
  accent: '#2B2A27',
  onAccent: '#FFFFFF',
  danger: '#B3543F',
  reasonColors: {
    hungry: '#8A9A7E',
    bored: '#C08552',
    stressed: '#7B93AB',
    tired: '#9B7E96',
    social: '#C9A24B',
    habit: '#6B9A8F',
  },
  reasonColorsMuted: {
    hungry: '#E4E9DF',
    bored: '#F2E2D3',
    stressed: '#DFE5EC',
    tired: '#E9DFE7',
    social: '#F3E9D3',
    habit: '#E1EDE9',
  },
  untaggedColor: '#C7C2B4',
};

export const darkColors: ThemeColors = {
  background: '#1C1B18',
  surface: '#252420',
  surfaceMuted: '#2E2B25',
  textPrimary: '#EDEAE3',
  textSecondary: '#B5AFA0',
  textMuted: '#7A7566',
  border: '#3A362F',
  accent: '#EDEAE3',
  onAccent: '#1C1B18',
  danger: '#D97B63',
  reasonColors: {
    hungry: '#9DB08F',
    bored: '#D69A6C',
    stressed: '#8FA8C2',
    tired: '#B192AC',
    social: '#DCB768',
    habit: '#8FBDB0',
  },
  reasonColorsMuted: {
    hungry: '#333B2E',
    bored: '#3C3128',
    stressed: '#2C333B',
    tired: '#372E35',
    social: '#3B331F',
    habit: '#293B37',
  },
  untaggedColor: '#5C574B',
};

export type ThemePreference = 'system' | 'light' | 'dark';
const THEME_PREFERENCE_KEY = 'themePreference';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
  };

  const isDark = (preference === 'system' ? systemScheme : preference) === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export function useTheme(): ThemeColors {
  return useThemeContext().colors;
}

export function useThemeSettings(): {
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
} {
  const { isDark, preference, setPreference } = useThemeContext();
  return { isDark, preference, setPreference };
}
