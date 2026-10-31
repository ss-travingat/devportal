import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const includeThumbnail = formData.get('include_thumbnail') || 'false';
    const fileName = (file as File).name || 'upload.jpg';

    const backendFormData = new FormData();
    backendFormData.append('file', file, fileName);
    backendFormData.append('include_thumbnail', String(includeThumbnail));

    try {
      const res = await backendFetch('/api/internal/devportal/media/upload', {
        method: 'POST',
        body: backendFormData,
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: unknown) {
      console.warn('Backend upload unreachable, check if Django is running:', err);
      return NextResponse.json(
        {
          error: 'Backend media engine service is offline or unreachable at http://127.0.0.1:8000',
        },
        { status: 503 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
