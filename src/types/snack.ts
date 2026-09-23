export type ReasonTag = 'bored' | 'habit' | 'hungry' | 'social' | 'stressed' | 'tired';

export interface Snack {
  id: string;
  text: string;
  timestamp: number; // epoch ms
  reason?: ReasonTag;
}

export const REASON_TAGS: ReasonTag[] = ['bored', 'habit', 'hungry', 'social', 'stressed', 'tired'];

export const REASON_LABELS: Record<ReasonTag, string> = {
  bored: 'Bored',
  habit: 'Habit',
  hungry: 'Hungry',
  social: 'Social',
  stressed: 'Stressed',
  tired: 'Tired',
};
