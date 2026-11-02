import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();
    const endpoint = `/api/media${query ? `?${query}` : ''}`;

    const res = await backendFetch(endpoint);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch media assets from backend' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend assets unreachable:', err);
    }
    return NextResponse.json({ count: 0, next: null, previous: null, results: [], is_offline: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const res = await backendFetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to upload and queue asset' },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('Error uploading media asset:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
