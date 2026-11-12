import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Frankfurter is free, no API key required. Next.js revalidates once per hour.
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.INR;
    if (typeof rate !== 'number' || rate <= 0) throw new Error('INR rate missing or invalid');
    return NextResponse.json({ USD_TO_INR: rate });
  } catch (err) {
    console.error('[/api/fx] FX rate fetch failed, using fallback:', err);
    return NextResponse.json({ USD_TO_INR: FALLBACK_USD_TO_INR, fallback: true });
  }
}
