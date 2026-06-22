/**
 * Runtime configuration read from Expo public env vars (EXPO_PUBLIC_*).
 *
 * IMPORTANT: only NON-secret values live here. The Gemini API key is never
 * shipped in the app — it stays as a Supabase Edge Function secret. The values
 * below (Supabase project URL + anon key) are designed to be public.
 */
export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

/** True when the real AI backend (Supabase Edge Function) is configured. */
export const hasAiBackend = Boolean(config.supabaseUrl && config.supabaseAnonKey);
