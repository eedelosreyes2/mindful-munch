import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://douoivwmpytvuzoccpmi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_X9kEqMfladmLsciU2J6JVA_WNs6jHpj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
