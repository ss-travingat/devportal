import Link from 'next/link';
import { ArrowRight, Component } from 'lucide-react';
import { FRAMER_COMPONENTS } from '@/lib/framer-components';

export default function FramerComponentsIndexPage() {
  return (
    <div className="px-8 py-8 max-w-[1200px] w-full">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight text-white">Framer Components</h1>
        <p className="text-[13px] text-white/60 mt-1">
          Live previews of the Framer code components from travingat-landing, rendered exactly as
          their source runs — plus a one-click download of each .tsx file.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRAMER_COMPONENTS.map((c) => (
          <Link
            key={c.slug}
            href={`/framer-components/${c.slug}`}
            className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                  <Component className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white">
                  {c.file}
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-white mb-1.5">{c.title}</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">{c.description}</p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-end text-[12px]">
              <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
                Preview <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
