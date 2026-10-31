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

// POST: Add new subscription via Django backend (with local sync)
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

    // Call Django Backend
    try {
      const res = await backendFetch('/api/internal/devportal/service-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });
      const resData = await res.json();
      if (res.ok && resData.subscription) {
        const subscriptions = readSubscriptionsFromFile();
        subscriptions.unshift(resData.subscription);
        writeSubscriptionsToFile(subscriptions);
        return NextResponse.json({ success: true, subscription: resData.subscription }, { status: 201 });
      } else if (!res.ok && resData.errors) {
        return NextResponse.json(
          { message: resData.message || 'Validation failed', errors: resData.errors },
          { status: res.status }
        );
      }
    } catch (backendErr) {
      console.warn('Backend service payments POST failed, using local fallback:', backendErr);
    }

    // Local fallback
    const subscriptions = readSubscriptionsFromFile();
    const timestamp = new Date().toISOString();
    const newRecord: Subscription = {
      ...validData,
      amount: validData.amount || '0.00',
      id: `sub-${Date.now()}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    subscriptions.unshift(newRecord);
    writeSubscriptionsToFile(subscriptions);

    return NextResponse.json({ success: true, subscription: newRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while creating subscription' },
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

    // Call Django Backend
    try {
      const res = await backendFetch(`/api/internal/devportal/service-payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });
      const resData = await res.json();
      if (res.ok && resData.subscription) {
        const subscriptions = readSubscriptionsFromFile();
        const index = subscriptions.findIndex((s) => s.id === id);
        if (index !== -1) {
          subscriptions[index] = resData.subscription;
        } else {
          subscriptions.unshift(resData.subscription);
        }
        writeSubscriptionsToFile(subscriptions);
        return NextResponse.json({ success: true, subscription: resData.subscription });
      } else if (!res.ok && resData.errors) {
        return NextResponse.json(
          { message: resData.message || 'Validation failed', errors: resData.errors },
          { status: res.status }
        );
      }
    } catch (backendErr) {
      console.warn('Backend service payments PUT failed, using local fallback:', backendErr);
    }

    // Local fallback
    const subscriptions = readSubscriptionsFromFile();
    const index = subscriptions.findIndex((s) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    const updatedRecord: Subscription = {
      ...subscriptions[index],
      ...validData,
      amount: validData.amount || '0.00',
      updatedAt: new Date().toISOString(),
    };

    subscriptions[index] = updatedRecord;
    writeSubscriptionsToFile(subscriptions);

    return NextResponse.json({ success: true, subscription: updatedRecord });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while updating subscription' },
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

    // Call Django Backend
    try {
      await backendFetch(`/api/internal/devportal/service-payments/${id}`, {
        method: 'DELETE',
      });
    } catch (backendErr) {
      console.warn('Backend service payments DELETE failed, removing locally:', backendErr);
    }

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
