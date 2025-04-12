import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/'];
  const protectedRoutes = ['/scenarios'];
  
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname === route);
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // If there's no session and trying to access a protected route
  // if (!session && isProtectedRoute) {
  //   const redirectUrl = req.nextUrl.clone();
  //   redirectUrl.pathname = '/login';
  //   redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }

  // If there's a session and trying to access login page
  if (session && req.nextUrl.pathname === '/login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 