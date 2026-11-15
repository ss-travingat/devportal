import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFramerComponent } from '@/lib/framer-components';

const FRAMER_DIR = path.join(process.cwd(), 'src', 'components', 'framer');

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getFramerComponent(slug);
  if (!meta) {
    return NextResponse.json({ error: 'Unknown component' }, { status: 404 });
  }

  const filePath = path.join(FRAMER_DIR, meta.file);
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${meta.file}"`,
    },
  });
}
