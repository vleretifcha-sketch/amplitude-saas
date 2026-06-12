import { type NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/auth';
import { getPublicSupabaseEnv } from '@/lib/env';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PREFIXES = ['/login', '/auth/callback', '/api/stripe/webhook'];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const env = getPublicSupabaseEnv();
  if (!env) {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isPublicPath(pathname)) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      if (!isAdminEmail(user.email)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    if (pathname === '/login' && user && isAdminEmail(user.email)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
