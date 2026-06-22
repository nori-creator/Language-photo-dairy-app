import { Category } from '@/types';

/** Pokédex-style categories. `targetWords` power the locked "?" slots. */
export const CATEGORIES: Category[] = [
  { id: 'fruit', name: 'くだもの', emoji: '🍓', targetWords: ['蘋果', '香蕉', '橘子', '葡萄', '西瓜'] },
  { id: 'animal', name: 'どうぶつ', emoji: '🐾', targetWords: ['狗', '貓', '鳥', '魚', '兔子'] },
  { id: 'food', name: 'たべもの', emoji: '🍜', targetWords: ['咖啡', '麵', '飯', '麵包', '蛋'] },
  { id: 'sign', name: 'まちの標識', emoji: '🪧', targetWords: ['公車站', '出口', '入口', '小心', '禁止'] },
  { id: 'object', name: 'もちもの', emoji: '🎒', targetWords: ['雨傘', '鑰匙', '手機', '錢包', '眼鏡'] },
];

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
