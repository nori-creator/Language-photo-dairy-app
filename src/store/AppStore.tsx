import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';
import { DiaryEntry, LanguageCode, Profile, VocabCard } from '@/types';
import { DEFAULT_PROFILE } from '@/data/seed';
import { Recall, initialSrs, review } from '@/lib/srs';
import { dayKey, updateStreak } from '@/lib/streak';
import { supabase } from '@/lib/supabase';
import { services } from '@/services';
import { uploadImage } from '@/lib/storage';
import { getQueue, removeFromQueue } from '@/lib/captureQueue';
import { cardToRow, profileToRow, rowToCard, rowToProfile } from '@/lib/mappers';

interface AppState {
  session: Session | null;
  loading: boolean;
  cards: VocabCard[];
  profile: Profile;
  addCard: (card: VocabCard) => Promise<void>;
  reviewCard: (id: string, recall: Recall) => void;
  deleteCard: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
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

  const deleteCard = useCallback(async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('cards').delete().eq('id', id);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      const userId = session?.user.id;
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        if (userId) supabase.from('profiles').upsert(profileToRow(next, userId)).then(() => {});
        return next;
      });
    },
    [session?.user.id],
  );

  // ── Offline capture queue: stickerize pending captures once back online ────
  const processing = useRef(false);
  const processQueue = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId || processing.current) return;
    processing.current = true;
    try {
      const queue = await getQueue();
      for (const item of queue) {
        try {
          const candidates = await services.identify.identify({
            photo: '',
            imageBase64: item.photoBase64,
            target: item.targetLanguage as LanguageCode,
            native: item.nativeLanguage as LanguageCode,
            mode: item.source === 'ocr' ? 'ocr' : 'object',
          });
          const top = candidates[0];
          if (!top) {
            await removeFromQueue(item.id); // nothing detectable — drop it
            continue;
          }
          const [{ sticker }, fields, photoUrl] = await Promise.all([
            item.source === 'ocr'
              ? Promise.resolve({ sticker: '' })
              : services.cutout.cutout({ photo: '', imageBase64: item.photoBase64 }).catch(() => ({ sticker: '' })),
            services.enrich.enrich({ word: top.word, target: item.targetLanguage as LanguageCode, native: item.nativeLanguage as LanguageCode }),
            uploadImage(userId, item.photoBase64, 'photo', 'image/jpeg').catch(() => null),
          ]);
          let stickerUrl = photoUrl ?? '';
          if (sticker.startsWith('data:')) {
            stickerUrl = await uploadImage(userId, sticker, 'sticker', 'image/png').catch(() => photoUrl ?? '');
          }
          let selfUrl: string | null = null;
          if (item.selfieBase64) selfUrl = await uploadImage(userId, item.selfieBase64, 'self', 'image/jpeg').catch(() => null);

          const card: VocabCard = {
            id: `c_${Date.now()}`,
            sticker: stickerUrl,
            photo: photoUrl ?? '',
            targetLanguage: item.targetLanguage as LanguageCode,
            word: top.word,
            categoryId: top.categoryId,
            ...fields,
            reading: fields.reading || top.reading,
            audioUri: null,
            srs: initialSrs(),
            capturedAt: item.createdAt,
            location: item.location ?? undefined,
            userComment: item.note ?? null,
            source: item.source,
            selfPhoto: selfUrl,
          };
          await addCard(card);
          await removeFromQueue(item.id);
        } catch {
          // Likely still offline / transient — stop and retry next time.
          break;
        }
      }
    } finally {
      processing.current = false;
    }
  }, [session?.user.id, addCard]);

  // Drain the queue on login and whenever connectivity returns.
  useEffect(() => {
    if (!session?.user.id) return;
    processQueue();
    const unsub = NetInfo.addEventListener((s) => {
      if (s.isConnected) processQueue();
    });
    return () => unsub();
  }, [session?.user.id, processQueue]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const capturedToday = useMemo(
    () => cards.filter((c) => dayKey(new Date(c.capturedAt)) === dayKey()).length,
    [cards],
  );
  const diary = useMemo(() => buildDiary(cards), [cards]);

  const value = useMemo(
    () => ({ session, loading, cards, profile, addCard, reviewCard, deleteCard, updateProfile, capturedToday, diary, signOut }),
    [session, loading, cards, profile, addCard, reviewCard, deleteCard, updateProfile, capturedToday, diary, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
