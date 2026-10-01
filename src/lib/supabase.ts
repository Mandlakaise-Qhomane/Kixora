import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const procEnv = (typeof process !== 'undefined' && process.env) || {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key'
  );
};

let client: SupabaseClient | null = null;

/** Creates the client on first use so importing this module cannot crash Node. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getSupabase() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});
