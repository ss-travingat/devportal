import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const res = await backendFetch('/api/media/benchmarks');
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch benchmarks' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Backend benchmarks unreachable:', err);
    }
    return NextResponse.json({
      global: {
        total_assets: 0,
        total_variants: 0,
        original_size: 0,
        optimized_size: 0,
        saved_bytes: 0,
        format_breakdown: [],
      },
      recent_batches: [],
      is_offline: true,
    });
  }
}
