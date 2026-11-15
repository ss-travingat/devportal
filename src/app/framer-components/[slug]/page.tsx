import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { FRAMER_COMPONENTS, getFramerComponent } from '@/lib/framer-components';
import FramerPreview from '@/components/framer/FramerPreview';

export function generateStaticParams() {
  return FRAMER_COMPONENTS.map((c) => ({ slug: c.slug }));
}

async function FramerComponentPageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getFramerComponent(slug);
  if (!meta) notFound();

  return (
    <div className="px-8 py-8 max-w-[1200px] w-full">
      <Link
        href="/framer-components"
        className="inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Framer Components
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">{meta.title}</h1>
          <p className="text-[13px] text-white/60 mt-1">{meta.description}</p>
          <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white/70">
            {meta.file}
          </span>
        </div>

        <a
          href={`/api/framer-components/${meta.slug}/download`}
          download={meta.file}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Download .tsx
        </a>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8 flex items-center justify-center min-h-[360px]">
        <div className="w-full max-w-[480px]">
          <FramerPreview slug={meta.slug} />
        </div>
      </div>
    </div>
  );
}

export default function FramerComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-16 flex flex-col items-center gap-3 text-zinc-500 text-sm">
          <span className="animate-pulse text-2xl">◌</span>
          <span>Loading component...</span>
        </div>
      }
    >
      <FramerComponentPageContent params={params} />
    </Suspense>
  );
}
