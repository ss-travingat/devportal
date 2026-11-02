import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');
    const endpoint = `/api/media/stats${username ? `?username=${encodeURIComponent(username)}` : ''}`;
    const res = await backendFetch(endpoint);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch media engine stats from backend' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend stats unreachable:', err);
    }
    return NextResponse.json({
      total_media: 0,
      images_count: 0,
      videos_count: 0,
      saved_bytes: 0,
      savings_pct: 0,
      original_size: 0,
      optimized_size: 0,
      thumb_size: 0,
      job_counts: { pending: 0, processing: 0, success: 0, failure: 0, retrying: 0 },
      format_breakdown: [],
      recent_jobs: [],
      is_offline: true,
    });
  }
}
