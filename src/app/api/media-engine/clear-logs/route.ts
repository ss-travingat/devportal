import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const res = await backendFetch('/api/internal/devportal/media/clear-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: 'Failed to clear logs' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
