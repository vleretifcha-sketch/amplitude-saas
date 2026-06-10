import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseEnv, getServiceRoleKey } from '@/lib/env';

/** Client service role — mutations CMS uniquement côté serveur */
export function createAdminClient() {
  const env = getPublicSupabaseEnv();
  const key = getServiceRoleKey();
  if (!env || !key) {
    throw new Error('Missing Supabase server env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }
  return createClient(env.url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
