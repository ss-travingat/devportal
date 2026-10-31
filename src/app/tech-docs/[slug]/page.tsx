import { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import TechDocDetailClient from './TechDocDetailClient';

export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), 'src', 'docs');
  try {
    if (!fs.existsSync(docsDir)) return [];
    return fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ slug: f.replace(/\.md$/, '') }));
  } catch {
    return [];
  }
}

async function TechDocPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TechDocDetailClient key={slug} slug={slug} />;
}

export default function TechDocDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-16 flex flex-col items-center gap-3 text-zinc-500 text-sm">
          <span className="animate-pulse text-2xl">◌</span>
          <span>Loading document...</span>
        </div>
      }
    >
      <TechDocPageContent params={params} />
    </Suspense>
  );
}
