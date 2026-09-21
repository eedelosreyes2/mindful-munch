export type ReasonTag = 'hungry' | 'bored' | 'stressed' | 'tired' | 'social';

export interface Snack {
  id: string;
  text: string;
  timestamp: number; // epoch ms
  reason?: ReasonTag;
}

export const REASON_TAGS: ReasonTag[] = ['hungry', 'bored', 'stressed', 'tired', 'social'];

export const REASON_LABELS: Record<ReasonTag, string> = {
  hungry: 'Hungry',
  bored: 'Bored',
  stressed: 'Stressed',
  tired: 'Tired',
  social: 'Social',
};
