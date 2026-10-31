import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const res = await fetch(`${backendUrl}/api/admin/session`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
      },
    });

    const data = await res.json().catch(() => ({ authenticated: false }));
    const nextResponse = NextResponse.json(data, { status: res.status });

    const rawSetCookie = res.headers.get('set-cookie');
    if (rawSetCookie) {
      nextResponse.headers.set('set-cookie', rawSetCookie);
    }

    return nextResponse;
  } catch {
    // If backend is offline, check cookie presence as fallback
    const hasAdminSession = request.cookies.has('admin_session');
    return NextResponse.json({ authenticated: hasAdminSession });
  }
}

export async function DELETE(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  const cookieHeader = request.headers.get('cookie') || '';

  let djangoSetCookies: string[] = [];
  try {
    const res = await fetch(`${backendUrl}/api/admin/session`, {
      method: 'DELETE',
      headers: {
        cookie: cookieHeader,
      },
    });

    if (typeof res.headers.getSetCookie === 'function') {
      djangoSetCookies = res.headers.getSetCookie();
    } else {
      const sc = res.headers.get('set-cookie');
      if (sc) djangoSetCookies = [sc];
    }
  } catch {
    // Continue with client cookie deletion if backend fails
  }

  const nextResponse = NextResponse.json({ ok: true });

  // 1. Forward Django's Set-Cookie headers
  djangoSetCookies.forEach((c) => {
    nextResponse.headers.append('set-cookie', c);
  });

  // 2. Explicitly expire cookie for root domain (.travingat.com)
  nextResponse.headers.append(
    'set-cookie',
    'admin_session=; Path=/; Domain=.travingat.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly; Secure'
  );

  // 3. Explicitly expire cookie for host-only (localhost / preview)
  nextResponse.headers.append(
    'set-cookie',
    'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly'
  );

  return nextResponse;
}

