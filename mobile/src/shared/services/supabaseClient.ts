import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage?: any;
}

let supabaseInstance: SupabaseClient<any> | null = null;

export function initSupabase(config: SupabaseConfig): SupabaseClient<any> | null {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key missing, running in local state mode.');
    return null;
  }

  const isWeb = typeof window !== 'undefined' && !config.storage;

  try {
    supabaseInstance = createClient<any>(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: isWeb,
        storage: config.storage || (typeof window !== 'undefined' ? window.localStorage : undefined),
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }

  return supabaseInstance;
}

export function getSupabase(): SupabaseClient<any> | null {
  return supabaseInstance;
}
