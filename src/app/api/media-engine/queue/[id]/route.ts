import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/api/media/queue/${id}`, {
      method: 'DELETE',
    });

    if (res.status === 204 || res.status === 200) {
      return NextResponse.json({ success: true, message: `Job ${id} deleted` });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: data.error || 'Failed to delete job' },
      { status: res.status }
    );
  } catch (err: unknown) {
    console.error('Error deleting media job:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
