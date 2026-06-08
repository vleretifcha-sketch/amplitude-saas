import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/auth';

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    if (request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'config');
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
          headers?: Record<string, string>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              response.headers.set(key, value)
            );
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLogin = request.nextUrl.pathname.startsWith('/login');
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');

    if (isAuthCallback) return response;

    if (!user) {
      if (!isLogin) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const redirect = NextResponse.redirect(url);
        copyCookies(response, redirect);
        return redirect;
      }
      return response;
    }

    if (!isAdminEmail(user.email)) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'unauthorized');
      const redirect = NextResponse.redirect(url);
      copyCookies(response, redirect);
      return redirect;
    }

    if (isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      const redirect = NextResponse.redirect(url);
      copyCookies(response, redirect);
      return redirect;
    }

    return response;
  } catch {
    if (request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
