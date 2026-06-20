import { ColorTokens } from '@/theme';

/** A vivid accent per category — adds tasteful color (titles, icons, chips). */
const COLOR: Record<string, keyof ColorTokens> = {
  fruit: 'pink',
  animal: 'orange',
  food: 'green',
  sign: 'teal',
  object: 'indigo',
};

/** Returns a color-token key; resolve with `useColors()[categoryColor(id)]`. */
export function categoryColor(id: string): keyof ColorTokens {
  return COLOR[id] ?? 'blue';
}
