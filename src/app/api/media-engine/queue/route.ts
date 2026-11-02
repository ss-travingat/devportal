import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();
    const endpoint = `/api/media/queue${query ? `?${query}` : ''}`;

    const res = await backendFetch(endpoint);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch queue from backend' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend queue unreachable:', err);
    }
    return NextResponse.json({ count: 0, next: null, previous: null, results: [], is_offline: true });
  }
}
