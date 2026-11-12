import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-client';
import { subscriptionSchema } from '@/lib/validations/subscription';

// GET: Retrieve all subscriptions from backend
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const backendPath = `/api/internal/devportal/service-payments${queryString ? `?${queryString}` : ''}`;

  const res = await backendFetch(backendPath, { method: 'GET' });
  if (!res.ok) {
    return NextResponse.json({ message: `Backend error (${res.status})` }, { status: res.status });
  }
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.subscriptions || [];
  return NextResponse.json(list);
}

// POST: Add new subscription via Django backend
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const validationResult = subscriptionSchema.safeParse(body);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validationResult.error.issues) {
      const k = issue.path[0]?.toString() || 'form';
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return NextResponse.json({ message: 'Validation failed', errors: fieldErrors }, { status: 400 });
  }

  const res = await backendFetch('/api/internal/devportal/service-payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validationResult.data),
  });
  const resData = await res.json();

  if (res.ok && resData.subscription) {
    return NextResponse.json({ success: true, subscription: resData.subscription }, { status: 201 });
  }

  const firstErr = resData.errors ? String(Object.values(resData.errors)[0]) : undefined;
  return NextResponse.json(
    { message: firstErr || resData.message || `Backend error (${res.status})`, errors: resData.errors },
    { status: res.status }
  );
}

// PUT: Update existing subscription via Django backend
export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { id, ...formData } = body;
  if (!id) {
    return NextResponse.json({ message: 'Missing record id' }, { status: 400 });
  }

  const validationResult = subscriptionSchema.safeParse(formData);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validationResult.error.issues) {
      const k = issue.path[0]?.toString() || 'form';
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return NextResponse.json({ message: 'Validation failed', errors: fieldErrors }, { status: 400 });
  }

  const res = await backendFetch(`/api/internal/devportal/service-payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validationResult.data),
  });
  const resData = await res.json();

  if (res.ok && resData.subscription) {
    return NextResponse.json({ success: true, subscription: resData.subscription });
  }

  const firstErr = resData.errors ? String(Object.values(resData.errors)[0]) : undefined;
  return NextResponse.json(
    { message: firstErr || resData.message || `Backend error (${res.status})`, errors: resData.errors },
    { status: res.status }
  );
}

// DELETE: Remove subscription via Django backend
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'Missing record id' }, { status: 400 });
  }

  const res = await backendFetch(`/api/internal/devportal/service-payments/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const resData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: (resData as Record<string, string>).message || `Backend error (${res.status})` },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
