import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { Subscription } from '@/types/subscription';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'subscriptions.json');

// Helper to safely read records from JSON file
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

// Helper to write records to JSON file
function writeSubscriptionsToFile(subscriptions: Subscription[]): void {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(subscriptions, null, 2), 'utf-8');
}

// GET: Retrieve all subscriptions from the JSON file
export async function GET() {
  const data = readSubscriptionsFromFile();
  return NextResponse.json(data);
}

// POST: Add new subscription after Zod validation
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
    const subscriptions = readSubscriptionsFromFile();
    const timestamp = new Date().toISOString();

    const newRecord: Subscription = {
      ...validData,
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
      { message: 'Internal server error while saving to JSON file' },
      { status: 500 }
    );
  }
}

// PUT: Update existing subscription after Zod validation
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
    const subscriptions = readSubscriptionsFromFile();
    const index = subscriptions.findIndex((s) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    const updatedRecord: Subscription = {
      ...subscriptions[index],
      ...validData,
      updatedAt: new Date().toISOString(),
    };

    subscriptions[index] = updatedRecord;
    writeSubscriptionsToFile(subscriptions);

    return NextResponse.json({ success: true, subscription: updatedRecord });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while updating JSON file' },
      { status: 500 }
    );
  }
}

// DELETE: Remove subscription from the JSON file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing record id' }, { status: 400 });
    }

    const subscriptions = readSubscriptionsFromFile();
    const filtered = subscriptions.filter((s) => s.id !== id);

    writeSubscriptionsToFile(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { message: 'Internal server error while deleting from JSON file' },
      { status: 500 }
    );
  }
}

