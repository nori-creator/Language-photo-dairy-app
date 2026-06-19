import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

/**
 * Supabase client. Session is persisted in AsyncStorage so the user stays
 * logged in across restarts. Uses the public URL + anon key (safe to ship);
 * model/secret keys live only in the Edge Function.
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
