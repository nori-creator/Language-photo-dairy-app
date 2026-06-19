import { ExampleSentence, LanguageCode, Profile, VocabCard } from '@/types';

/** Maps between Supabase rows (snake_case) and app domain types (camelCase). */

export function rowToCard(r: any): VocabCard {
  return {
    id: r.id,
    sticker: r.sticker_url ?? r.photo_url ?? '🃏',
    photo: r.photo_url ?? '',
    targetLanguage: r.target_language as LanguageCode,
    word: r.word,
    reading: r.reading ?? '',
    ipa: r.ipa ?? '',
    meaning: r.meaning ?? '',
    partOfSpeech: r.part_of_speech ?? '',
    level: r.level ?? '',
    examples: (r.examples ?? []) as ExampleSentence[],
    collocations: r.collocations ?? [],
    synonyms: r.synonyms ?? [],
    antonyms: r.antonyms ?? [],
    etymology: r.etymology ?? '',
    note: r.note ?? '',
    audioUri: r.audio_url ?? null,
    categoryId: r.category_id ?? 'object',
    srs: {
      ease: Number(r.srs_ease ?? 2.5),
      intervalDays: r.srs_interval_days ?? 0,
      repetitions: r.srs_repetitions ?? 0,
      dueAt: r.srs_due_at ?? new Date().toISOString(),
      lapses: r.srs_lapses ?? 0,
    },
    capturedAt: r.captured_at ?? new Date().toISOString(),
    location: r.lat != null && r.lng != null
      ? { latitude: r.lat, longitude: r.lng, name: r.location_name ?? undefined }
      : undefined,
  };
}

/** Build a DB insert payload for a card (user_id added by the caller). */
export function cardToRow(c: VocabCard, userId: string) {
  return {
    user_id: userId,
    photo_url: c.photo || null,
    sticker_url: c.sticker || null,
    target_language: c.targetLanguage,
    word: c.word,
    reading: c.reading,
    ipa: c.ipa,
    meaning: c.meaning,
    part_of_speech: c.partOfSpeech,
    level: c.level,
    examples: c.examples,
    collocations: c.collocations,
    synonyms: c.synonyms,
    antonyms: c.antonyms,
    etymology: c.etymology,
    note: c.note,
    audio_url: c.audioUri,
    category_id: c.categoryId,
    srs_ease: c.srs.ease,
    srs_interval_days: c.srs.intervalDays,
    srs_repetitions: c.srs.repetitions,
    srs_due_at: c.srs.dueAt,
    srs_lapses: c.srs.lapses,
    captured_at: c.capturedAt,
    lat: c.location?.latitude ?? null,
    lng: c.location?.longitude ?? null,
    location_name: c.location?.name ?? null,
  };
}

export function rowToProfile(r: any): Profile {
  return {
    nativeLanguage: r.native_language as LanguageCode,
    targetLanguage: r.target_language as LanguageCode,
    plan: r.plan,
    streak: r.streak ?? 0,
    lastActiveDate: r.last_active_date ?? new Date().toISOString().slice(0, 10),
    habitHour: r.habit_hour ?? null,
    goal: r.goal_name ? { name: r.goal_name, requiredWords: r.goal_required_words ?? 0 } : undefined,
  };
}

export function profileToRow(p: Profile, userId: string) {
  return {
    id: userId,
    native_language: p.nativeLanguage,
    target_language: p.targetLanguage,
    plan: p.plan,
    streak: p.streak,
    last_active_date: p.lastActiveDate,
    habit_hour: p.habitHour,
    goal_name: p.goal?.name ?? null,
    goal_required_words: p.goal?.requiredWords ?? null,
  };
}
