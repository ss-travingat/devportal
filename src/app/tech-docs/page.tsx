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
    <div className="px-8 py-8 max-w-[900px] w-full">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight text-white">Tech Documentation</h1>
        <p className="text-[13px] text-white/50 mt-1">
          Internal architecture guides, data model references, runbooks, and API docs.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white/30 text-[13px] animate-pulse">
          Loading documentation...
        </div>
      ) : (
        <TechDocsList docs={docs} />
      )}
    </div>
  );
}

