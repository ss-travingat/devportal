import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'https://api.travingat.com';
  const token = process.env.DEVPORTAL_API_TOKEN || '';

  return NextResponse.json({
    uploadUrl: `${backendUrl.replace(/\/$/, '')}/api/internal/devportal/media/upload`,
    token,
  });
}
