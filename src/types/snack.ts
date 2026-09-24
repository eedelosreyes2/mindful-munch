export type ReasonTag = 'bored' | 'craving' | 'habit' | 'hungry' | 'social' | 'stressed' | 'tired';

export interface Snack {
  id: string;
  text: string;
  timestamp: number; // epoch ms
  reason?: ReasonTag;
}

export const REASON_TAGS: ReasonTag[] = [
  'bored',
  'craving',
  'habit',
  'hungry',
  'social',
  'stressed',
  'tired',
];

export const REASON_LABELS: Record<ReasonTag, string> = {
  bored: 'Bored',
  craving: 'Craving',
  habit: 'Habit',
  hungry: 'Hungry',
  social: 'Social',
  stressed: 'Stressed',
  tired: 'Tired',
};
