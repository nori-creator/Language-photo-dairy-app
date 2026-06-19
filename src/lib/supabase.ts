import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config, hasAiBackend } from '@/config';

/**
 * Supabase client. Session is persisted in AsyncStorage so the user stays
 * logged in across restarts. Uses the public URL + anon key (safe to ship);
 * model/secret keys live only in the Edge Function.
 *
 * Falls back to harmless placeholders when env vars are missing so the app
 * still boots (into the login screen with a "not configured" warning) instead
 * of crashing at import time — `createClient` throws on empty url/key.
 */
export const supabase = createClient(
  config.supabaseUrl || 'https://placeholder.supabase.co',
  config.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/** Whether Supabase is actually configured (vs. running on placeholders). */
export const isSupabaseConfigured = hasAiBackend;

