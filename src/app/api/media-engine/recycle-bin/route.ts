import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();
    const endpoint = `/api/media/recycle_bin${query ? `?${query}` : ''}`;

    const res = await backendFetch(endpoint);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch recycle bin' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend recycle bin unreachable:', err);
    }
    return NextResponse.json({ count: 0, next: null, previous: null, results: [], is_offline: true });
  }
}

export async function DELETE() {
  try {
    const res = await backendFetch('/api/media/empty_recycle_bin', {
      method: 'DELETE',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to empty recycle bin' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error emptying recycle bin:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
