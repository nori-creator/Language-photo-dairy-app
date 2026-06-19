import { config } from '@/config';
import { IdentifyCandidate } from '@/types';
import { EnrichService, EnrichedFields, IdentifyService } from './types';

/**
 * Real implementations backed by the Supabase Edge Function "ai", which holds
 * the Gemini API key server-side. The app only knows the (public) Supabase URL
 * and anon key — never the model key.
 */

async function callBackend<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${config.supabaseUrl}/functions/v1/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Backend error ${res.status}`);
  }
  return data as T;
}

export const geminiIdentify: IdentifyService = {
  async identify({ imageBase64, photo, target, native }) {
    const { candidates } = await callBackend<{ candidates: IdentifyCandidate[] }>('identify', {
      imageBase64: imageBase64 ?? photo,
      target,
      native,
    });
    return candidates ?? [];
  },
};

const EMPTY_FIELDS: EnrichedFields = {
  reading: '',
  ipa: '',
  meaning: '',
  partOfSpeech: '—',
  level: '—',
  examples: [],
  collocations: [],
  synonyms: [],
  antonyms: [],
  etymology: '',
  note: '',
};

export const geminiEnrich: EnrichService = {
  async enrich({ word, target, native }) {
    const { fields } = await callBackend<{ fields: Partial<EnrichedFields> }>('enrich', {
      word,
      target,
      native,
    });
    // Backfill any missing soft fields so the card UI never sees undefined.
    return { ...EMPTY_FIELDS, meaning: word, ...fields };
  },
};
