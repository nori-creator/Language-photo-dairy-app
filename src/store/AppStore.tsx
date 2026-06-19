import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { DiaryEntry, Profile, VocabCard } from '@/types';
import { DEFAULT_PROFILE } from '@/data/seed';
import { Recall, review } from '@/lib/srs';
import { dayKey, updateStreak } from '@/lib/streak';
import { supabase } from '@/lib/supabase';
import { cardToRow, profileToRow, rowToCard, rowToProfile } from '@/lib/mappers';

interface AppState {
  session: Session | null;
  loading: boolean;
  cards: VocabCard[];
  profile: Profile;
  addCard: (card: VocabCard) => Promise<void>;
  reviewCard: (id: string, recall: Recall) => void;
  capturedToday: number;
  diary: DiaryEntry[];
  signOut: () => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  // Track auth session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load (or create) this user's profile + cards whenever they log in.
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setCards([]);
      setProfile(DEFAULT_PROFILE);
      return;
    }
    let cancelled = false;
    (async () => {
      // Profile — create a default row on first login.
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (cancelled) return;
      if (prof) {
        setProfile(rowToProfile(prof));
      } else {
        const fresh: Profile = { ...DEFAULT_PROFILE, streak: 0 };
        await supabase.from('profiles').upsert(profileToRow(fresh, userId));
        setProfile(fresh);
      }
      const { data: rows } = await supabase
        .from('cards')
        .select('*')
        .order('captured_at', { ascending: false });
      if (!cancelled && rows) setCards(rows.map(rowToCard));
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const addCard = useCallback(
    async (card: VocabCard) => {
      const userId = session?.user.id;
      if (!userId) return;
      const today = dayKey();
      const nextProfile: Profile = {
        ...profile,
        streak: updateStreak(profile.streak, profile.lastActiveDate, today),
        lastActiveDate: today,
        habitHour: new Date().getHours(),
      };
      // Persist card, then reflect the DB-assigned id locally.
      const { data, error } = await supabase
        .from('cards')
        .insert(cardToRow(card, userId))
        .select()
        .single();
      const saved = !error && data ? rowToCard(data) : card;
      setCards((prev) => [saved, ...prev]);
      setProfile(nextProfile);
      await supabase.from('profiles').upsert(profileToRow(nextProfile, userId));
    },
    [session?.user.id, profile],
  );

  const reviewCard = useCallback(
    (id: string, recall: Recall) => {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const srs = review(c.srs, recall);
          supabase
            .from('cards')
            .update({
              srs_ease: srs.ease,
              srs_interval_days: srs.intervalDays,
              srs_repetitions: srs.repetitions,
              srs_due_at: srs.dueAt,
              srs_lapses: srs.lapses,
            })
            .eq('id', id)
            .then(() => {});
          return { ...c, srs };
        }),
      );
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const capturedToday = useMemo(
    () => cards.filter((c) => dayKey(new Date(c.capturedAt)) === dayKey()).length,
    [cards],
  );
  const diary = useMemo(() => buildDiary(cards), [cards]);

  const value = useMemo(
    () => ({ session, loading, cards, profile, addCard, reviewCard, capturedToday, diary, signOut }),
    [session, loading, cards, profile, addCard, reviewCard, capturedToday, diary, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
