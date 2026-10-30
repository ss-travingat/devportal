import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'src', 'docs');

interface DocFrontmatter {
  title?: string;
  description?: string;
  category?: string;
  author?: string;
  updatedAt?: string;
}

function parseFrontmatter(content: string): { frontmatter: DocFrontmatter; body: string } {
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(fmRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const fmRaw = match[1];
  const body = match[2];
  const frontmatter: DocFrontmatter = {};

  for (const line of fmRaw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) (frontmatter as Record<string, string>)[key] = value;
  }

  return { frontmatter, body };
}

function getDocFiles(): string[] {
  try {
    if (!fs.existsSync(DOCS_DIR)) return [];
    return fs
      .readdirSync(DOCS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort();
  } catch {
    return [];
  }
}

// GET /api/docs — list all or get one by slug
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    // Return single document content
    const filePath = path.join(DOCS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(raw);

    return NextResponse.json({
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      category: frontmatter.category || 'General',
      author: frontmatter.author || 'Unknown',
      updatedAt: frontmatter.updatedAt || '',
      content: body,
    });
  }

  // Return list of all documents (metadata only)
  const files = getDocFiles();
  const docs = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '');
    const filePath = path.join(DOCS_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter } = parseFrontmatter(raw);
    return {
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      category: frontmatter.category || 'General',
      author: frontmatter.author || 'Unknown',
      updatedAt: frontmatter.updatedAt || '',
    };
  });

  return NextResponse.json(docs);
}

