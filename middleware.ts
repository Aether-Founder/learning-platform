/**
 * Middleware for Authentication and Route Protection
 *
 * This middleware runs on every request and:
 * 1. Refreshes the user's session if needed
 * 2. Protects authenticated routes (dashboard, vakken, etc.)
 * 3. Redirects unauthenticated users to login
 * 4. Redirects authenticated users away from login/register pages
 */

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip middleware if env vars are missing (allows build to succeed)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase environment variables not configured. Auth will be disabled.');
    return res;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    return res;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define route patterns
  const isAuthPage =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register') ||
    req.nextUrl.pathname.startsWith('/reset-password');

  const isProtectedRoute =
    req.nextUrl.pathname === '/dashboard' ||
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/vakken') ||
    req.nextUrl.pathname.startsWith('/agenda') ||
    req.nextUrl.pathname.startsWith('/calendar') ||
    req.nextUrl.pathname.startsWith('/lessen') ||
    req.nextUrl.pathname.startsWith('/decks') ||
    req.nextUrl.pathname.startsWith('/planner') ||
    req.nextUrl.pathname.startsWith('/statistieken') ||
    req.nextUrl.pathname.startsWith('/groepen') ||
    req.nextUrl.pathname.startsWith('/notities') ||
    req.nextUrl.pathname.startsWith('/cijfers') ||
    req.nextUrl.pathname.startsWith('/instellingen') ||
    req.nextUrl.pathname.startsWith('/admin');

  // If user is not logged in and trying to access protected route
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', req.url);
    if (req.nextUrl.pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in and trying to access auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (we'll handle auth there separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
