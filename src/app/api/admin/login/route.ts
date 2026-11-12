import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  const body = await request.json().catch(() => ({}));

  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const res = await fetch(`${backendUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': clientIp,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    const nextResponse = NextResponse.json(data, { status: res.status });

    // Forward Set-Cookie header (admin_session) from Django, stripping
    // Domain= so the cookie scopes to the current host — Django sets
    // Domain=.travingat.com which the browser rejects on localhost.
    const rawSetCookie = res.headers.get('set-cookie');
    if (rawSetCookie) {
      const stripped = rawSetCookie
        .split(/;\s*/g)
        .filter((p) => !/^domain=/i.test(p))
        .join('; ');
      nextResponse.headers.set('set-cookie', stripped);
    }

    return nextResponse;
  } catch (err: unknown) {
    console.error('Admin login backend error:', err);
    return NextResponse.json(
      { error: 'Backend connection failed. Please ensure the backend is running.' },
      { status: 503 }
    );
  }
}

