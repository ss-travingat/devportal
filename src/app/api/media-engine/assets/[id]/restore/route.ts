import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/media/${id}/restore`, {
      method: 'POST',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to restore asset' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error restoring media asset:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}

