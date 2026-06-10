import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicSupabaseEnv } from '@/lib/env';

export async function createClient() {
  const env = getPublicSupabaseEnv();
  if (!env) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* ignore — Server Component */
        }
      },
    },
  });
}
