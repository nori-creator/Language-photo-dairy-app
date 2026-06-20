import { hasAiBackend } from '@/config';
import { mockCutout, mockEnrich, mockIdentify } from './mock';
import { geminiCutout, geminiEnrich, geminiIdentify } from './gemini';
import { speechTts } from './speech';
import { CutoutService, EnrichService, IdentifyService, TtsService } from './types';

/**
 * Service registry.
 *
 * - When EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set (see .env.example), the
 *   identify + enrich services hit the real Gemini-backed Edge Function.
 * - Otherwise everything runs on the offline mocks (no keys needed).
 *
 * Cutout uses remove.bg via the Edge Function when REMOVEBG_API_KEY is set
 * server-side (otherwise it gracefully falls back to the raw photo). TTS stays
 * mocked for now (pronunciation audio is a later phase).
 */
export const services: {
  identify: IdentifyService;
  cutout: CutoutService;
  enrich: EnrichService;
  tts: TtsService;
} = {
  identify: hasAiBackend ? geminiIdentify : mockIdentify,
  cutout: hasAiBackend ? geminiCutout : mockCutout,
  enrich: hasAiBackend ? geminiEnrich : mockEnrich,
  tts: speechTts,
};

export * from './types';
