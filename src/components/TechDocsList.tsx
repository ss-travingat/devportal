'use client';

import React, { useMemo, useState } from 'react';
import { Search, FileText, Clock, User, Tag } from 'lucide-react';
import { DocMeta } from '@/types/docs';

interface TechDocsListProps {
  docs: DocMeta[];
  onSelect: (slug: string) => void;
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
        d.category.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocMeta[]>();
    for (const doc of filtered) {
      const cat = doc.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(doc);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search docs by title, category, or author..."
          className="w-full sm:max-w-sm pl-9 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-sm">
          No documents found matching &quot;{search}&quot;
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, categoryDocs]) => (
          <div key={category} className="space-y-3">
            {/* Category header */}
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                {category}
              </span>
              <div className="flex-1 h-px bg-zinc-800 ml-1" />
            </div>

            {/* Doc cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryDocs.map((doc) => (
                <button
                  key={doc.slug}
                  onClick={() => onSelect(doc.slug)}
                  className="group text-left p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all duration-150 hover:bg-zinc-900/80 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2 bg-zinc-800 border border-zinc-700/60 rounded-md shrink-0">
                      <FileText className="w-4 h-4 text-zinc-300" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded shrink-0 mt-0.5">
                      .md
                    </span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-zinc-100 transition-colors leading-snug">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-600 pt-1 border-t border-zinc-800/80">
                    {doc.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {doc.author}
                      </span>
                    )}
                    {doc.updatedAt && (
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {doc.updatedAt}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

