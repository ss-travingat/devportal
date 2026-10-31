'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocDetail } from '@/types/docs';
import MarkdownViewer from '@/components/MarkdownViewer';

export default function TechDocDetailClient({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadDoc() {
      try {
        const res = await fetch(`/api/docs?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`Document not found (${res.status})`);
        const data: DocDetail = await res.json();
        if (!ignore) {
          setDoc(data);
          setError('');
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }

    if (slug) {
      loadDoc();
    }

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          {doc ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {doc.title}
              </h1>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                {doc.category && (
                  <span className="font-mono uppercase tracking-wider">
                    {doc.category}
                  </span>
                )}
                {doc.author && <span>by {doc.author}</span>}
                {doc.updatedAt && <span>Updated: {doc.updatedAt}</span>}
              </div>
            </>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
              {slug ? slug.replace(/-/g, ' ') : 'Loading Document...'}
            </h1>
          )}
        </div>

        <div>
          <Link
            href="/tech-docs"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Documents</span>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="py-16 flex flex-col items-center gap-3 text-zinc-500 text-sm">
          <span className="animate-pulse text-2xl">◌</span>
          <span>Loading document...</span>
        </div>
      )}

      {error && (
        <div className="py-8 px-4 border border-zinc-800 rounded-lg bg-zinc-950 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200 mb-1">Failed to load document</p>
          <p className="font-mono text-xs">{error}</p>
          <Link
            href="/tech-docs"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to docs list
          </Link>
        </div>
      )}

      {doc && !loading && (
        <div className="pb-12">
          <MarkdownViewer content={doc.content} />
        </div>
      )}
    </div>
  );
}
