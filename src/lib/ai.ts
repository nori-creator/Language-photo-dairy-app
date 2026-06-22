import { config } from '@/config';

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
  if (!res.ok || data.error) throw new Error(data.error ?? `Backend error ${res.status}`);
  return data as T;
}

export interface PronScore {
  recognized: string;
  accuracy: number;
  fluency: number;
  completeness: number;
  pron: number;
}

/** Phoneme-level pronunciation score (0–100) from Azure, given a 16k mono WAV. */
export function scorePronunciation(audioBase64: string, referenceText: string): Promise<PronScore> {
  return callBackend<PronScore>('pronounce', { audioBase64, referenceText });
}

/** 3 plausible wrong Japanese meanings (same category) for a 4-choice quiz. */
export async function fetchDistractors(word: string, meaning: string, categoryId: string): Promise<string[]> {
  const { distractors } = await callBackend<{ distractors: string[] }>('quiz', { word, meaning, categoryId });
  return distractors ?? [];
}

/** Pass threshold (Azure PronScore 0–100) per user strictness setting. */
export function pronThreshold(strictness?: 'lenient' | 'normal' | 'strict'): number {
  return strictness === 'strict' ? 88 : strictness === 'lenient' ? 60 : 75;
}
