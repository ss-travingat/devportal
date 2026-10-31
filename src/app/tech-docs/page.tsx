'use client';

import React, { useState, useEffect } from 'react';
import { DocMeta } from '@/types/docs';
import TechDocsList from '@/components/TechDocsList';

export default function TechDocsIndexPage() {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data: DocMeta[]) => {
        if (Array.isArray(data)) setDocs(data);
      })
      .catch((err) => console.error('Failed to load docs list:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Tech Documentation
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Internal technical guides, architecture diagrams, and API references.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-zinc-500 text-sm">
          <span className="animate-pulse text-2xl">◌</span>
          <span>Loading documentation...</span>
        </div>
      ) : (
        <TechDocsList docs={docs} />
      )}
    </div>
  );
}

