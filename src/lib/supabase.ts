import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export type ContributionRow = {
  id: string;
  user_id: string;
  display_name: string;
  photo_path: string;
  task_title: string;
  description: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      contributions: {
        Row: ContributionRow;
        Insert: Omit<ContributionRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ContributionRow, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
  };
};

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: Platform.OS === 'web' ? 'pkce' : 'implicit',
      
    },
  });

  return supabaseClient;
}
