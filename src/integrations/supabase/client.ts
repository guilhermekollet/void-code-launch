
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment variables check:', {
  VITE_SUPABASE_URL: SUPABASE_URL ? 'defined' : 'undefined',
  VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'defined' : 'undefined'
});

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is not set. Please check your environment configuration.');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set. Please check your environment configuration.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
