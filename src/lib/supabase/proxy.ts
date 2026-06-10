import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseEnv } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const env = getPublicSupabaseEnv();
  if (!env) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
