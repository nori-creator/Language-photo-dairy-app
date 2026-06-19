import { IdentifyCandidate, LanguageCode, VocabCard } from '@/types';

/**
 * Service contracts. Each has a mock implementation (works offline, no keys)
 * and will later have a real implementation backed by a Supabase Edge Function.
 * Swap via src/services/index.ts once API keys are configured.
 */

export interface IdentifyService {
  /** Analyze a photo and propose several candidate subjects to turn into a card. */
  identify(input: { photo: string; target: LanguageCode; native: LanguageCode }): Promise<IdentifyCandidate[]>;
}

export interface CutoutService {
  /** Remove the background, returning a sticker-style cut-out of the subject. */
  cutout(input: { photo: string }): Promise<{ sticker: string }>;
}

export type EnrichedFields = Pick<
  VocabCard,
  | 'reading' | 'ipa' | 'meaning' | 'partOfSpeech' | 'level'
  | 'examples' | 'collocations' | 'synonyms' | 'antonyms' | 'etymology' | 'note'
>;

export interface EnrichService {
  /**
   * Build a full card back for a confirmed word.
   * Dictionary fields (meaning/POS/IPA/level) are authoritative;
   * the softer fields (examples/etymology/note) are AI-generated.
   */
  enrich(input: { word: string; target: LanguageCode; native: LanguageCode }): Promise<EnrichedFields>;
}

export interface TtsService {
  /** Synthesize native pronunciation; returns a (cached) audio URI. */
  speak(input: { text: string; target: LanguageCode }): Promise<{ audioUri: string }>;
}
