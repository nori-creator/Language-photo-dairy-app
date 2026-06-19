import { hasAiBackend } from '@/config';
import { mockCutout, mockEnrich, mockIdentify, mockTts } from './mock';
import { geminiEnrich, geminiIdentify } from './gemini';
import { CutoutService, EnrichService, IdentifyService, TtsService } from './types';

/**
 * Service registry.
 *
 * - When EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set (see .env.example), the
 *   identify + enrich services hit the real Gemini-backed Edge Function.
 * - Otherwise everything runs on the offline mocks (no keys needed).
 *
 * Cutout (background removal) and TTS stay mocked for now: the captured photo
 * is used as-is for the card, and pronunciation audio is a later phase.
 */
export const services: {
  identify: IdentifyService;
  cutout: CutoutService;
  enrich: EnrichService;
  tts: TtsService;
} = {
  identify: hasAiBackend ? geminiIdentify : mockIdentify,
  cutout: mockCutout,
  enrich: hasAiBackend ? geminiEnrich : mockEnrich,
  tts: mockTts,
};

export * from './types';
