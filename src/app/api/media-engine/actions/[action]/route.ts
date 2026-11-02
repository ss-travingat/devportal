import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await context.params;

    if (action === 'scan-unoptimized') {
      const res = await backendFetch('/api/media/scan-unoptimized', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error || 'Failed to queue unoptimized scan' },
          { status: res.status }
        );
      }
      return NextResponse.json(data);
    }

    if (action === 'scan-missing-thumbnails') {
      let body = {};
      try {
        body = await request.json();
      } catch {
        // empty body ok
      }

      const res = await backendFetch('/api/media/scan-missing-thumbnails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error || 'Failed to queue thumbnail scan' },
          { status: res.status }
        );
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: unknown) {
    console.error('Error executing media action:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}

