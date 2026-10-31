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

  try {
    const res = await fetch(`${backendUrl}/api/admin/session`, {
      method: 'DELETE',
      headers: {
        cookie: cookieHeader,
      },
    });

    const data = await res.json().catch(() => ({ ok: true }));
    const nextResponse = NextResponse.json(data, { status: res.status });

    const rawSetCookie = res.headers.get('set-cookie');
    if (rawSetCookie) {
      nextResponse.headers.set('set-cookie', rawSetCookie);
    }

    // Explicitly delete cookie on response
    nextResponse.cookies.delete('admin_session');
    return nextResponse;
  } catch {
    const nextResponse = NextResponse.json({ ok: true });
    nextResponse.cookies.delete('admin_session');
    return nextResponse;
  }
}

