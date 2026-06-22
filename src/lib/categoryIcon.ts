import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Monochrome SF-style icon per category — replaces the old decorative emoji
 * (🍓🐾…) so identity reads as clean line-art, with the captured photo as the
 * real hero. Falls back to a neutral tag for unknown categories.
 */
const ICONS: Record<string, IoniconName> = {
  fruit: 'nutrition-outline',
  animal: 'paw-outline',
  food: 'restaurant-outline',
  sign: 'navigate-outline',
  object: 'cube-outline',
};

export function categoryIcon(id: string): IoniconName {
  return ICONS[id] ?? 'pricetag-outline';
}
