import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { backendFetch } from '@/lib/backend-client';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { Subscription } from '@/types/subscription';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'subscriptions.json');

// Helper to safely read records from local JSON file
function readSubscriptionsFromFile(): Subscription[] {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return [];
    }
    const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading subscriptions JSON:', error);
    return [];
  }
}

// Helper to write records to local JSON file
function writeSubscriptionsToFile(subscriptions: Subscription[]): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(subscriptions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write subscriptions to file:', err);
  }
}

// GET: Retrieve all subscriptions from backend (fallback to JSON file if offline)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendPath = `/api/internal/devportal/service-payments${queryString ? `?${queryString}` : ''}`;

    const res = await backendFetch(backendPath, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      const list: Subscription[] = Array.isArray(data) ? data : data.subscriptions || [];
      writeSubscriptionsToFile(list);
      return NextResponse.json(list);
    }
  } catch (err) {
    console.warn('Backend service payments GET unreachable, falling back to local file:', err);
  }

  const fallback = readSubscriptionsFromFile();
  return NextResponse.json(fallback);
}

// POST: Add new subscription via Django backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate using Zod
    const validationResult = subscriptionSchema.safeParse(body);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0]?.toString() || 'form';
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      return NextResponse.json(
        { message: 'Validation failed', errors: fieldErrors },
        { status: 400 }
      );
    }

    const validData = validationResult.data;

    let res: Response;
    let resData: Record<string, unknown>;
    try {
      res = await backendFetch('/api/internal/devportal/service-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });
      resData = await res.json();
    } catch (backendErr) {
      console.error('Backend service payments POST unreachable:', backendErr);
      return NextResponse.json(
        { message: 'Could not reach backend server. Check server logs.', errors: { form: 'Server unavailable' } },
        { status: 503 }
      );
    }

    if (res.ok && resData.subscription) {
      const subscriptions = readSubscriptionsFromFile();
      subscriptions.unshift(resData.subscription as Subscription);
      writeSubscriptionsToFile(subscriptions);
      return NextResponse.json({ success: true, subscription: resData.subscription }, { status: 201 });
    }

    // Propagate all backend errors — no local fallback for writes
    return NextResponse.json(
      {
        message: (resData.message as string) || `Backend error (${res.status})`,
        errors: (resData.errors as Record<string, string>) || { form: (resData.message as string) || 'Server error' },
      },
      { status: res.status }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while creating subscription', errors: { form: 'Internal error' } },
      { status: 500 }
    );
  }
}

// PUT: Update existing subscription via Django backend
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...formData } = body;

    if (!id) {
      return NextResponse.json({ message: 'Missing record id' }, { status: 400 });
    }

    // Validate using Zod
    const validationResult = subscriptionSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0]?.toString() || 'form';
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      return NextResponse.json(
        { message: 'Validation failed', errors: fieldErrors },
        { status: 400 }
      );
    }

    const validData = validationResult.data;

    let res: Response;
    let resData: Record<string, unknown>;
    try {
      res = await backendFetch(`/api/internal/devportal/service-payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });
      resData = await res.json();
    } catch (backendErr) {
      console.error('Backend service payments PUT unreachable:', backendErr);
      return NextResponse.json(
        { message: 'Could not reach backend server. Check server logs.', errors: { form: 'Server unavailable' } },
        { status: 503 }
      );
    }

    if (res.ok && resData.subscription) {
      // Update local file cache on success
      const subscriptions = readSubscriptionsFromFile();
      const index = subscriptions.findIndex((s) => s.id === id);
      if (index !== -1) {
        subscriptions[index] = resData.subscription as Subscription;
      } else {
        subscriptions.unshift(resData.subscription as Subscription);
      }
      writeSubscriptionsToFile(subscriptions);
      return NextResponse.json({ success: true, subscription: resData.subscription });
    }

    // Propagate all backend errors — no local fallback for writes
    return NextResponse.json(
      {
        message: (resData.message as string) || `Backend error (${res.status})`,
        errors: (resData.errors as Record<string, string>) || { form: (resData.message as string) || 'Server error' },
      },
      { status: res.status }
    );
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while updating subscription', errors: { form: 'Internal error' } },
      { status: 500 }
    );
  }
}

// DELETE: Remove subscription via Django backend
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing record id' }, { status: 400 });
    }

    let res: Response;
    let resData: Record<string, unknown>;
    try {
      res = await backendFetch(`/api/internal/devportal/service-payments/${id}`, {
        method: 'DELETE',
      });
      resData = await res.json();
    } catch (backendErr) {
      console.error('Backend service payments DELETE unreachable:', backendErr);
      return NextResponse.json(
        { message: 'Could not reach backend server.' },
        { status: 503 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: (resData.message as string) || `Backend error (${res.status})` },
        { status: res.status }
      );
    }

    // Remove from local file cache on success
    const subscriptions = readSubscriptionsFromFile();
    const filtered = subscriptions.filter((s) => s.id !== id);
    writeSubscriptionsToFile(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while deleting subscription' },
      { status: 500 }
    );
  }
}
