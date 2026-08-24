/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Check your .env file.'
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
