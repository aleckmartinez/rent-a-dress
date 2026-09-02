import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
