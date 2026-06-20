import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { config, hasAiBackend } from '@/config';
import { LanguageCode } from '@/types';
import { TtsService } from './types';

/** BCP-47 locale per target language (device-voice fallback). */
const LOCALE: Record<LanguageCode, string> = {
  'zh-TW': 'zh-TW',
  'zh-CN': 'zh-CN',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  ko: 'ko-KR',
  ja: 'ja-JP',
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Cache one player per word so repeat taps are instant.
const players = new Map<string, AudioPlayer>();

/** Fetch a natural Taiwan Mandarin clip from the Edge Function and cache it. */
async function taiwanVoice(text: string): Promise<AudioPlayer | null> {
  if (players.has(text)) return players.get(text)!;
  try {
    const res = await fetch(`${config.supabaseUrl}/functions/v1/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        apikey: config.supabaseAnonKey,
      },
      body: JSON.stringify({ action: 'tts', text }),
    });
    const data = await res.json();
    if (!res.ok || !data.audioBase64) return null;
    const file = `${FileSystem.cacheDirectory}tts_${hash(text)}.mp3`;
    await FileSystem.writeAsStringAsync(file, data.audioBase64, { encoding: FileSystem.EncodingType.Base64 });
    const player = createAudioPlayer(file);
    players.set(text, player);
    return player;
  } catch {
    return null;
  }
}

/**
 * Pronunciation. For Taiwan Mandarin it plays a real zh-TW voice fetched from
 * the Edge Function (so it sounds Taiwanese, not mainland) and caches it.
 * Falls back to the on-device voice if that's unavailable/offline.
 */
export const speechTts: TtsService = {
  async speak({ text, target }) {
    if (target === 'zh-TW' && hasAiBackend) {
      const player = await taiwanVoice(text);
      if (player) {
        try {
          player.seekTo(0);
          player.play();
          return { audioUri: '' };
        } catch {
          /* fall through to device voice */
        }
      }
    }
    Speech.stop();
    Speech.speak(text, { language: LOCALE[target] ?? 'zh-TW', rate: 0.9, pitch: 1.0 });
    return { audioUri: '' };
  },
};
