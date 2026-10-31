import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const filter = request.nextUrl.searchParams.get('filter') || 'all';

    const res = await backendFetch(`/api/internal/devportal/media/uploads?filter=${encodeURIComponent(filter)}`, {
      method: 'GET',
    });

    if (!res.ok) {
      return NextResponse.json({ uploads: [], total: 0, error: 'Failed to fetch uploads' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend list uploads unreachable:', err);
    }
    return NextResponse.json({ uploads: [], total: 0, is_offline: true });
  }
}
