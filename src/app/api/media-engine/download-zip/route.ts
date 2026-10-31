import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = body.ids || [];

    const res = await backendFetch('/api/internal/devportal/media/download-zip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: 'ZIP download failed' }));
      return NextResponse.json(errJson, { status: res.status });
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', 'attachment; filename="travingat_optimized_media.zip"');

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
