import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const res = await backendFetch('/api/media/queue/reconcile-stale', {
      method: 'POST',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to reconcile stale jobs on backend' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend reconcile-stale unreachable:', err);
    }
    return NextResponse.json(
      { error: 'Backend is currently unreachable' },
      { status: 503 }
    );
  }
}

