import * as Speech from 'expo-speech';
import { LanguageCode } from '@/types';
import { TtsService } from './types';

/** BCP-47 voice locale per target language (Taiwan Mandarin for zh-TW). */
const LOCALE: Record<LanguageCode, string> = {
  'zh-TW': 'zh-TW',
  'zh-CN': 'zh-CN',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  ko: 'ko-KR',
  ja: 'ja-JP',
};

/**
 * On-device pronunciation via the OS speech engine. For zh-TW this uses the
 * system's Taiwan Mandarin voice when installed (falls back to the closest
 * Mandarin voice otherwise). Speaks immediately; no audio file is produced.
 */
export const speechTts: TtsService = {
  async speak({ text, target }) {
    Speech.stop();
    Speech.speak(text, { language: LOCALE[target] ?? 'zh-TW', rate: 0.9, pitch: 1.0 });
    return { audioUri: '' };
  },
};
