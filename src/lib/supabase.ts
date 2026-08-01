import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { backendEnvironment } from '@/src/config/environment';

let client: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (client) return client;
  const { supabasePublishableKey, supabaseUrl } = backendEnvironment;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase is not configured. Add the EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables.');
  }

  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
