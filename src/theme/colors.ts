import { useColorScheme } from 'react-native';
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
  },
  reasonColorsMuted: {
    hungry: '#E4E9DF',
    bored: '#F2E2D3',
    stressed: '#DFE5EC',
    tired: '#E9DFE7',
    social: '#F3E9D3',
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
  },
  reasonColorsMuted: {
    hungry: '#333B2E',
    bored: '#3C3128',
    stressed: '#2C333B',
    tired: '#372E35',
    social: '#3B331F',
  },
  untaggedColor: '#5C574B',
};

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
