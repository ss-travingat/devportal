import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/media/${id}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch media asset details' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend asset detail unreachable:', err);
    }
    return NextResponse.json({ error: 'Backend unreachable', is_offline: true }, { status: 503 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/media/${id}`, {
      method: 'DELETE',
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to delete asset' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error deleting media asset:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
