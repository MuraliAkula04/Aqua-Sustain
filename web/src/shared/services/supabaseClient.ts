import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage?: any;
}

let supabaseInstance: SupabaseClient<any> | null = null;

export function initSupabase(config: SupabaseConfig): SupabaseClient<any> {
  const isWeb = typeof window !== 'undefined' && !config.storage;

  supabaseInstance = createClient<any>(config.supabaseUrl || '', config.supabaseAnonKey || '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isWeb,
      storage: config.storage || (typeof window !== 'undefined' ? window.localStorage : undefined),
    },
  });

  return supabaseInstance;
}

export function getSupabase(): SupabaseClient<any> | null {
  return supabaseInstance;
}
