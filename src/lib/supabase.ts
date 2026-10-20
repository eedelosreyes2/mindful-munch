import type { SupabaseClient } from '@supabase/supabase-js';

// Cloud sync is web-only; the native build keeps snacks on the device.
export const supabase: SupabaseClient | null = null;
