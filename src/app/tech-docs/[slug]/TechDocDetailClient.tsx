'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Clock, User, Tag, ArrowLeft, ArrowRight } from 'lucide-react';
import { DocDetail, DocMeta } from '@/types/docs';
import MarkdownViewer from '@/components/MarkdownViewer';
import { groupDocsByCategory, readingOrder } from '@/lib/docs-order';

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

function stripLeadingTitle(content: string, title: string): string {
  const m = content.match(/^\s*#\s+(.+?)\s*\r?\n/);
  if (m && m[1].trim() === title.trim()) return content.slice(m[0].length).replace(/^\s+/, '');
  return content;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// The docs list is static for the life of a deploy; cache it so moving between
// documents doesn't make the sidebar flash empty while it refetches.
let cachedDocList: DocMeta[] | null = null;

export default function TechDocDetailClient({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState('');
  const [allDocs, setAllDocs] = useState<DocMeta[]>(cachedDocList ?? []);

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

  useEffect(() => {
    if (cachedDocList) return;
    let ignore = false;
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data: DocMeta[]) => {
        if (!Array.isArray(data)) return;
        cachedDocList = data;
        if (!ignore) setAllDocs(data);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  // The page header already renders the title as an <h1>, so drop the Markdown's own
  // leading "# Title" line when it repeats it.
  const content = doc?.content ?? '';
  const title = doc?.title ?? '';
  const body = useMemo(() => (content ? stripLeadingTitle(content, title) : ''), [content, title]);
  const toc = useMemo(() => (body ? extractTOC(body) : []), [body]);
  const groupedDocs = useMemo(() => groupDocsByCategory(allDocs), [allDocs]);
  const { prevDoc, nextDoc } = useMemo(() => {
    const ordered = readingOrder(allDocs);
    const i = ordered.findIndex((d) => d.slug === slug);
    return {
      prevDoc: i > 0 ? ordered[i - 1] : null,
      nextDoc: i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null,
    };
  }, [allDocs, slug]);

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

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left sidebar: all documents + table of contents (desktop only) */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-zinc-800/40">
        <div className="sticky top-[52px] p-5 overflow-y-auto max-h-[calc(100vh-52px)] space-y-6">
          <nav aria-label="All documents">
            <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-3">
              Documents
            </p>
            <div className="space-y-4">
              {Array.from(groupedDocs.entries()).map(([category, docs]) => (
                <div key={category}>
                  <p className="text-[11px] font-medium text-white/40 mb-1">{category}</p>
                  <ul className="flex flex-col gap-0.5">
                    {docs.map((d) => {
                      const isActive = d.slug === slug;
                      return (
                        <li key={d.slug}>
                          <Link
                            href={`/tech-docs/${d.slug}`}
                            aria-current={isActive ? 'page' : undefined}
                            className={`block rounded-md px-2 py-1.5 text-[12px] leading-snug transition-colors ${
                              isActive
                                ? 'bg-zinc-800/70 text-white font-medium'
                                : 'text-white/50 hover:text-white hover:bg-zinc-800/40'
                            }`}
                          >
                            {d.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {toc.length > 0 && (
            <nav aria-label="On this page" className="pt-5 border-t border-zinc-800/40">
              <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-3">
                On this page
              </p>
              <div className="flex flex-col gap-0.5">
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
                        ? 'text-white font-medium'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {text}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 sm:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/30 text-sm">
            <span className="animate-pulse">Loading document...</span>
          </div>
        ) : error ? (
          <div className="max-w-[800px]">
            <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-950 text-sm text-white/60">
              <p className="font-medium text-white mb-1">Failed to load document</p>
              <p className="font-mono text-xs">{error}</p>
              <Link href="/tech-docs" className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                Back to docs
              </Link>
            </div>
          </div>
        ) : doc ? (
          <div className="max-w-[760px]">
            {/* Doc header */}
            <div className="mb-8 pb-6 border-b border-zinc-800/60">
              <h1 className="text-[26px] font-bold tracking-tight text-white mb-2">
                {doc.title}
              </h1>

              {doc.description && (
                <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                  {doc.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[12px] text-white/40">
                {doc.category && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    <span className="text-white/50">{doc.category}</span>
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
            <MarkdownViewer content={body} />

            {/* Previous / Next doc: always one row, Previous on the left, Next on the right */}
            {(prevDoc || nextDoc) && (
              <nav aria-label="Previous and next doc" className="mt-12 grid grid-cols-2 gap-3">
                {prevDoc && (
                  <Link
                    href={`/tech-docs/${prevDoc.slug}`}
                    className="group min-w-0 flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 px-3 py-3 sm:px-4 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1 text-[11px] leading-4 text-white/40 group-hover:text-white/60 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                      Previous doc
                    </span>
                    <span className="text-[13px] sm:text-[14px] leading-snug font-medium text-white line-clamp-2">
                      {prevDoc.title}
                    </span>
                  </Link>
                )}
                {nextDoc && (
                  <Link
                    href={`/tech-docs/${nextDoc.slug}`}
                    className="group col-start-2 min-w-0 flex flex-col items-end gap-1 text-right rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 px-3 py-3 sm:px-4 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1 text-[11px] leading-4 text-white/40 group-hover:text-white/60 transition-colors">
                      Next doc
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-[13px] sm:text-[14px] leading-snug font-medium text-white line-clamp-2">
                      {nextDoc.title}
                    </span>
                  </Link>
                )}
              </nav>
            )}

            {/* Footer */}
            <div className={`${prevDoc || nextDoc ? 'mt-6' : 'mt-12'} pt-6 border-t border-zinc-800/40 flex items-center justify-between gap-4`}>
              <Link
                href="/tech-docs"
                className="inline-flex items-center gap-1.5 text-[12px] leading-none text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                All docs
              </Link>
              {doc.updatedAt && (
                <span className="text-[11px] text-white/20">
                  Last updated {formatDate(doc.updatedAt)}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
