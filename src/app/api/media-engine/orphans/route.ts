import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET() {
  try {
    let res = await backendFetch('/api/media/orphans');
    if (!res.ok) {
      // Fallback to /api/profiles/orphans if needed
      res = await backendFetch('/api/profiles/orphans');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to scan orphans from backend' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error scanning orphans:', err);
    return NextResponse.json(
      { error: 'Backend unreachable while scanning orphans' },
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

    let res = await backendFetch('/api/media/orphans', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });

    if (!res.ok) {
      res = await backendFetch('/api/profiles/orphans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      });
    }

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

