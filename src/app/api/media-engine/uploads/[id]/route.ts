import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing upload id' }, { status: 400 });
    }

    const res = await backendFetch(`/api/internal/devportal/media/uploads/${encodeURIComponent(id)}/delete`, {
      method: 'POST',
    });

    const data = await res.json().catch(() => ({ error: 'Failed to delete upload' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
