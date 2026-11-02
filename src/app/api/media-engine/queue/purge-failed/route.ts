import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST() {
  try {
    const res = await backendFetch('/api/media/queue/purge-failed', {
      method: 'POST',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to purge failed jobs' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error purging failed media jobs:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
