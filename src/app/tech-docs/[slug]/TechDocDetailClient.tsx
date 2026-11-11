'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Clock, User, Tag, ChevronRight } from 'lucide-react';
import { DocDetail } from '@/types/docs';
import MarkdownViewer from '@/components/MarkdownViewer';

interface TocEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractTOC(content: string): TocEntry[] {
  return content
    .split('\n')
    .filter((l) => /^#{2,3}\s/.test(l))
    .map((l) => {
      const level = l.startsWith('### ') ? 3 : 2;
      const text = l.replace(/^#{2,3}\s+/, '').trim();
      return { level: level as 2 | 3, text, id: slugify(text) };
    });
}

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function TechDocDetailClient({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setDoc(null);
    setError('');

    fetch(`/api/docs?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Document not found (${res.status})`);
        return res.json();
      })
      .then((data: DocDetail) => { if (!ignore) { setDoc(data); setLoading(false); } })
      .catch((err: unknown) => { if (!ignore) { setError(err instanceof Error ? err.message : String(err)); setLoading(false); } });

    return () => { ignore = true; };
  }, [slug]);

  const toc = useMemo(() => (doc?.content ? extractTOC(doc.content) : []), [doc?.content]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (!toc.length) return;
    const headings = toc.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-600 text-sm">
        <span className="animate-pulse">Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-8 max-w-[800px]">
        <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-950 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200 mb-1">Failed to load document</p>
          <p className="font-mono text-xs">{error}</p>
          <Link href="/tech-docs" className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors">
            ← Back to docs
          </Link>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="flex min-h-0 flex-1">
      {/* TOC sidebar */}
      {toc.length > 0 && (
        <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-zinc-800/40">
          <div className="sticky top-[52px] p-5 overflow-y-auto max-h-[calc(100vh-52px)]">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-zinc-600 uppercase mb-3">
              On this page
            </p>
            <nav className="flex flex-col gap-0.5">
              {toc.map(({ level, text, id }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    setActiveId(id);
                  }}
                  className={`text-[12px] leading-relaxed transition-colors py-0.5 ${
                    level === 3 ? 'pl-3' : ''
                  } ${
                    activeId === id
                      ? 'text-zinc-100 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 px-8 py-8">
        <div className="max-w-[760px]">
          {/* Doc header */}
          <div className="mb-8 pb-6 border-b border-zinc-800/60">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-3">
              <Link href="/tech-docs" className="hover:text-zinc-400 transition-colors">
                Tech Docs
              </Link>
              <ChevronRight className="w-3 h-3" />
              {doc.category && (
                <>
                  <span className="text-zinc-500">{doc.category}</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-zinc-400">{doc.title}</span>
            </div>

            <h1 className="text-[26px] font-bold tracking-tight text-white mb-2">
              {doc.title}
            </h1>

            {doc.description && (
              <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                {doc.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-[12px] text-zinc-600">
              {doc.category && (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span className="text-zinc-500">{doc.category}</span>
                </span>
              )}
              {doc.author && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span>{doc.author}</span>
                </span>
              )}
              {doc.updatedAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatDate(doc.updatedAt)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <MarkdownViewer content={doc.content} />

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-zinc-800/40 flex items-center justify-between">
            <Link
              href="/tech-docs"
              className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-white transition-colors"
            >
              ← All Documents
            </Link>
            {doc.updatedAt && (
              <span className="text-[11px] text-zinc-700">
                Last updated {formatDate(doc.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
