import { mockCutout, mockEnrich, mockIdentify, mockTts } from './mock';
import { CutoutService, EnrichService, IdentifyService, TtsService } from './types';

/**
 * Service registry. Today everything points at the mock implementations so the
 * app runs with zero API keys. When the Supabase Edge Functions are deployed,
 * swap these bindings for the real clients (see README → "実APIキーの設定").
 */
export const services: {
  identify: IdentifyService;
  cutout: CutoutService;
  enrich: EnrichService;
  tts: TtsService;
} = {
  identify: mockIdentify,
  cutout: mockCutout,
  enrich: mockEnrich,
  tts: mockTts,
};

export * from './types';
