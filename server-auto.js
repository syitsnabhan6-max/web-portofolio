import dotenv from 'dotenv';

dotenv.config();

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

if (useSupabase) {
  await import('./server-supabase.js');
} else {
  await import('./server.js');
}

