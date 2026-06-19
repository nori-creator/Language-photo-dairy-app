import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DiaryEntry, Profile, VocabCard } from '@/types';
import { DEFAULT_PROFILE, SEED_CARDS } from '@/data/seed';
import { Recall, review } from '@/lib/srs';
import { dayKey, updateStreak } from '@/lib/streak';

interface AppState {
  cards: VocabCard[];
  profile: Profile;
  addCard: (card: VocabCard) => void;
  reviewCard: (id: string, recall: Recall) => void;
  capturedToday: number;
  diary: DiaryEntry[];
}

const AppContext = createContext<AppState | null>(null);

function buildDiary(cards: VocabCard[]): DiaryEntry[] {
  const byDay = new Map<string, string[]>();
  for (const c of cards) {
    const key = dayKey(new Date(c.capturedAt));
    byDay.set(key, [...(byDay.get(key) ?? []), c.id]);
  }
  return [...byDay.entries()]
    .map(([date, cardIds]) => ({ date, cardIds }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<VocabCard[]>(SEED_CARDS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  const addCard = useCallback((card: VocabCard) => {
    setCards((prev) => [card, ...prev]);
    setProfile((p) => {
      const today = dayKey();
      return {
        ...p,
        streak: updateStreak(p.streak, p.lastActiveDate, today),
        lastActiveDate: today,
        habitHour: new Date().getHours(),
      };
    });
  }, []);

  const reviewCard = useCallback((id: string, recall: Recall) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, srs: review(c.srs, recall) } : c))
    );
  }, []);

  const capturedToday = useMemo(
    () => cards.filter((c) => dayKey(new Date(c.capturedAt)) === dayKey()).length,
    [cards]
  );

  const diary = useMemo(() => buildDiary(cards), [cards]);

  const value = useMemo(
    () => ({ cards, profile, addCard, reviewCard, capturedToday, diary }),
    [cards, profile, addCard, reviewCard, capturedToday, diary]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
