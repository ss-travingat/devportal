'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EngineAsset } from '@/types/media';
import { formatBytes, formatDate } from '@/lib/media-utils';
import {
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react';

function MediaEngineAssetContent() {
  const params = useParams();
  const id = params?.id as string;

  const [asset, setAsset] = useState<EngineAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isRetrying, setIsRetrying] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const fetchAsset = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media-engine/assets/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load asset details');
      }
      const data = await res.json();
      setAsset(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading asset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReprocess = async () => {
    if (!id) return;
    setIsReprocessing(true);
    try {
      const res = await fetch(`/api/media-engine/assets/${id}/reprocess`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Reprocess task queued.');
        fetchAsset();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to queue reprocess.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/media-engine/queue/${jobId}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Job queued for retry.');
        fetchAsset();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to retry job.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-zinc-400 text-sm">Loading media asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Asset not found</h2>
        <p className="text-xs text-zinc-400">{error || 'Could not locate asset.'}</p>
        <Link
          href="/media-engine"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Media Engine</span>
        </Link>
      </div>
    );
  }

  const isVideo = asset.media_type === 'VIDEO';
  const originalUrl = asset.original?.url;
  const optimizedUrl = asset.optimized?.url;
  const originalSize = asset.original?.size || 0;
  const optimizedSize = asset.optimized?.file_size || null;
  const savingsPct =
    optimizedSize && originalSize > 0 && originalSize > optimizedSize
      ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
      : null;

  const jobs = asset.jobs || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <Link
            href="/media-engine"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Console</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white truncate max-w-md">
              {asset.original?.filename || 'Media Asset'}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${asset.status === 'DONE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}
            >
              {asset.status}
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-500">Asset UUID: {asset.id}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReprocess}
            disabled={isReprocessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>Reprocess</span>
          </button>
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">Original Source</span>
            <span className="font-mono text-zinc-400">{formatBytes(originalSize)}</span>
          </div>
          <div className="relative aspect-video rounded-lg bg-black border border-zinc-800 overflow-hidden flex items-center justify-center">
            {originalUrl ? (
              isVideo ? (
                <video src={originalUrl} controls className="w-full h-full object-contain" />
              ) : (
                <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
              )
            ) : (
              <span className="text-xs text-zinc-600">No original preview</span>
            )}
          </div>
          <div className="text-xs font-mono text-zinc-400 space-y-1">
            <div>
              Dimensions:{' '}
              {asset.original?.width
                ? `${asset.original.width}×${asset.original.height}`
                : 'Auto'}
            </div>
            <div>Format: {asset.original?.content_type || 'octet-stream'}</div>
            {originalUrl && (
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open URL</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(originalUrl, 'orig')}
                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-white"
                >
                  {copiedKey === 'orig' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'orig' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Optimized */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400">Optimized Variant</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-zinc-300">{formatBytes(optimizedSize)}</span>
              {savingsPct !== null && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  -{savingsPct}%
                </span>
              )}
            </div>
          </div>
          <div className="relative aspect-video rounded-lg bg-black border border-zinc-800 overflow-hidden flex items-center justify-center">
            {optimizedUrl ? (
              isVideo ? (
                <video src={optimizedUrl} controls className="w-full h-full object-contain" />
              ) : (
                <img src={optimizedUrl} alt="Optimized" className="w-full h-full object-contain" />
              )
            ) : (
              <span className="text-xs text-zinc-600">Pending optimization</span>
            )}
          </div>
          <div className="text-xs font-mono text-zinc-400 space-y-1">
            <div>Quality Score: {asset.optimized?.quality || 'Auto (85)'}</div>
            <div>Format: {asset.optimized?.content_type || 'image/avif'}</div>
            {optimizedUrl && (
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={optimizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open URL</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(optimizedUrl, 'opt')}
                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-white"
                >
                  {copiedKey === 'opt' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'opt' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Thumbnails */}
      {asset.thumbnails && asset.thumbnails.length > 0 && (
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Generated Thumbnails</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {asset.thumbnails.map((t, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>{t.size}px</span>
                  {t.quality && <span>Q:{t.quality}</span>}
                </div>
                <div className="relative aspect-video rounded bg-black overflow-hidden flex items-center justify-center">
                  {t.url ? (
                    <img src={t.url} alt={`thumb-${t.size}`} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-zinc-600">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Pipeline Jobs */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Job History & Stage Logs ({jobs.length} jobs)
        </h3>

        {jobs.length === 0 ? (
          <p className="text-xs text-zinc-500">No job records attached to this asset.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-200">
                    {job.job_type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${job.status === 'SUCCESS' || job.status === 'DONE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : job.status === 'PROCESSING'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                  >
                    {job.status}
                  </span>
                </div>

                {(job.status === 'FAILURE' || job.status === 'ERROR') && (
                  <button
                    type="button"
                    onClick={() => handleRetryJob(job.id)}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>Retry Job</span>
                  </button>
                )}
              </div>

              {job.error_message && (
                <div className="p-3 rounded bg-red-950/30 border border-red-500/20 text-xs text-red-300 font-mono">
                  {job.error_message}
                </div>
              )}

              {/* Logs */}
              {job.logs && job.logs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase">
                    Stage Trace
                  </div>
                  <div className="divide-y divide-zinc-850 rounded border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                    {job.logs.map((log, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-2.5 flex items-start justify-between gap-3 text-[11px] font-mono"
                      >
                        <div className="space-y-0.5">
                          <span className="text-blue-400 font-bold">[{log.stage}]</span>{' '}
                          <span className="text-zinc-300">{log.message}</span>
                        </div>
                        <span className="text-zinc-500 shrink-0">{formatDate(log.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function MediaEngineAssetPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-zinc-400 text-sm">Loading media asset...</p>
        </div>
      }
    >
      <MediaEngineAssetContent />
    </Suspense>
  );
}
