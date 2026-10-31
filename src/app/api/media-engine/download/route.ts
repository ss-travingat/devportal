import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const type = request.nextUrl.searchParams.get('type') || 'optimized';

    if (!id) {
      return NextResponse.json({ error: 'Missing upload id' }, { status: 400 });
    }

    const res = await backendFetch(`/api/internal/devportal/media/download/${encodeURIComponent(id)}?type=${encodeURIComponent(type)}`, {
      method: 'GET',
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: 'Download failed' }));
      return NextResponse.json(errJson, { status: res.status });
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('Content-Type') || 'image/avif');
    headers.set('Content-Disposition', res.headers.get('Content-Disposition') || 'attachment');

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
