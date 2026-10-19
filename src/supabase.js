import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE, configured } from './config';

export const supabase = createClient(
  configured() ? SUPABASE.url : 'https://placeholder.supabase.co',
  configured() ? SUPABASE.anonKey : 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
