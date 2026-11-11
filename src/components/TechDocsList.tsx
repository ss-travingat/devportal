'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Clock } from 'lucide-react';
import { DocMeta } from '@/types/docs';

interface TechDocsListProps {
  docs: DocMeta[];
  onSelect?: (slug: string) => void;
}

const CATEGORY_ORDER = ['Overview', 'Platform', 'Product', 'Operations', 'General'];

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TechDocsList({ docs, onSelect }: TechDocsListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocMeta[]>();
    for (const doc of filtered) {
      const cat = doc.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(doc);
    }
    // Sort categories by preferred order, then alphabetically
    return new Map(
      [...map.entries()].sort(([a], [b]) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    );
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documentation..."
          className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-white/40 text-[13px]">
          No documents found for &quot;{search}&quot;
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, categoryDocs]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-white/40 uppercase">
                {category}
              </span>
              <div className="flex-1 h-px bg-zinc-800/80" />
              <span className="text-[11px] text-white/20">{categoryDocs.length}</span>
            </div>

            {/* Doc rows */}
            <div className="border border-zinc-800/60 rounded-xl overflow-hidden divide-y divide-zinc-800/60">
              {categoryDocs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/tech-docs/${doc.slug}`}
                  onClick={() => onSelect?.(doc.slug)}
                  className="group flex items-start gap-4 px-5 py-4 bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-semibold text-white group-hover:text-zinc-100 transition-colors truncate">
                        {doc.title}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-[12px] text-white/50 leading-relaxed line-clamp-1">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 mt-0.5">
                    {doc.updatedAt && (
                      <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/30">
                        <Clock className="w-3 h-3" />
                        {formatDate(doc.updatedAt)}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
