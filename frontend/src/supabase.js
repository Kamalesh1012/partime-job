import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://rvuxitlbjpulbwsgduwz.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2dXhpdGxianB1bGJ3c2dkdXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTAzODQsImV4cCI6MjEwMjI2NjM4NH0.OHEtTrfs6LDnuMZ7Xp7tvwJVeXsgaeUKHYwnNKYDz-k';

let client = null;
try {
  if (supabaseUrl && supabaseAnonKey && typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http')) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.warn('Supabase initialization warning:', e);
}

export const supabase = client;
export default supabase;