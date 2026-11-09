import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Verifies the admin_session cookie is a valid signed token by asking Django.
 * Returns false on any network or parse error so the proxy fails closed.
 */
async function verifyAdminSession(cookie: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/session`, {
      headers: { Cookie: `admin_session=${cookie}` },
      // Don't follow redirects — a 302 means the cookie is bad.
      redirect: 'manual',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * Next.js 16 Proxy Convention
 * Enforces shared admin_session authentication across devportal routes.
 * The cookie is validated by Django on every request (not just checked for
 * existence), so a forged or expired cookie is rejected here.
 */
export async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const url = req.nextUrl;

  const adminCookie = req.cookies.get('admin_session')?.value?.trim();

  const isLoginPage = url.pathname === '/login' || url.pathname === '/signin';
  const isLogoutPage = url.pathname === '/logout';
  const isAuthApi = url.pathname.startsWith('/api/admin/');
  const isHealthApi = url.pathname === '/api/health';

  // Dedicated logout route handler: Purge cookie and redirect to login
  if (isLogoutPage) {
    const res = NextResponse.redirect(new URL('/login?logout=1', req.url));
    res.headers.append(
      'set-cookie',
      'admin_session=; Path=/; Domain=.travingat.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly; Secure'
    );
    res.headers.append(
      'set-cookie',
      'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly'
    );
    return res;
  }

  // Allow auth APIs and health check through without a session check so that
  // /api/admin/login and /api/admin/session themselves are always reachable.
  if (isAuthApi || isHealthApi) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Validate the cookie with Django (not just check for presence).
  const isAuthenticated = adminCookie ? await verifyAdminSession(adminCookie) : false;

  // If on login/signin:
  // - If ?logout=1 query present, purge cookies and allow viewing login page
  // - If already authenticated, redirect to destination
  // - If not authenticated, allow viewing login page
  if (isLoginPage) {
    if (url.searchParams.has('logout')) {
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      res.headers.append(
        'set-cookie',
        'admin_session=; Path=/; Domain=.travingat.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly; Secure'
      );
      res.headers.append(
        'set-cookie',
        'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly'
      );
      return res;
    }
    if (isAuthenticated) {
      const nextUrl = url.searchParams.get('next') || '/';
      return NextResponse.redirect(new URL(nextUrl, req.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Allow authenticated requests through
  if (isAuthenticated) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Unauthenticated API requests receive 401 JSON
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
  }

  // Unauthenticated page requests redirect to /login
  const redirectUrl = new URL('/login', req.url);
  redirectUrl.searchParams.set('next', url.pathname + url.search);
  return NextResponse.redirect(redirectUrl);
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};

