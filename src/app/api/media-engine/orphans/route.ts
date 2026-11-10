import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

const BACKEND_PATH = '/api/profiles/orphans';

// GET            -> cached scan result (backend scans synchronously if none exists yet)
// GET ?cached_only=1 -> cached result, or { pending: true } (202) while a queued scan is running
export async function GET(request: NextRequest) {
  try {
    const cachedOnly = request.nextUrl.searchParams.get('cached_only');
    const res = await backendFetch(`${BACKEND_PATH}${cachedOnly ? '?cached_only=1' : ''}`);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to scan orphans from backend' },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error('Error scanning orphans:', err);
    return NextResponse.json(
      { error: 'Backend unreachable while scanning orphans' },
      { status: 503 }
    );
  }
}

// POST -> queue the Celery scan on the maintenance worker; returns immediately.
export async function POST() {
  try {
    const res = await backendFetch(BACKEND_PATH, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to queue orphan scan' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error queueing orphan scan:', err);
    return NextResponse.json(
      { error: 'Backend unreachable while queueing orphan scan' },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const keys = body.keys || [];
    if (!keys || keys.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 });
    }

    const res = await backendFetch(BACKEND_PATH, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to delete orphans' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error deleting orphans:', err);
    return NextResponse.json(
      { error: 'Backend unreachable while deleting orphans' },
      { status: 503 }
    );
  }
}
