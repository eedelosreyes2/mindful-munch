import { ReasonTag } from '../types/snack';

export const colors = {
  background: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEBE2',
  textPrimary: '#2B2A27',
  textSecondary: '#716C61',
  textMuted: '#A39D8F',
  border: '#E4DFD3',
  accent: '#2B2A27',
};

// Deliberately muted/desaturated — no bright "alert" colors.
// A busy chart should still look calm.
export const reasonColors: Record<ReasonTag, string> = {
  hungry: '#8A9A7E', // sage
  bored: '#C08552', // clay
  stressed: '#7B93AB', // dusty blue
  tired: '#9B7E96', // muted plum
  social: '#C9A24B', // warm ochre
};

// For snacks logged without a reason tag — neutral, not a "missing data" red.
export const untaggedColor = '#C7C2B4';

export const reasonColorsMuted: Record<ReasonTag, string> = {
  hungry: '#E4E9DF',
  bored: '#F2E2D3',
  stressed: '#DFE5EC',
  tired: '#E9DFE7',
  social: '#F3E9D3',
};
