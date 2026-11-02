'use client';

import React, { useState } from 'react';
import { EngineAsset, EngineJob } from '@/types/media';
import { formatBytes, formatDuration, formatDate } from '@/lib/media-utils';
import {
  X,
  RotateCcw,
  RefreshCw,
  Download,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
} from 'lucide-react';

interface MediaJobDetailDrawerProps {
  asset: EngineAsset | null;
  job: EngineJob | null;
  isOpen: boolean;
  onClose: () => void;
  onRetryJob?: (jobId: string) => Promise<void>;
  onReprocessAsset?: (assetId: string) => Promise<void>;
  onDeleteAsset?: (assetId: string) => Promise<void>;
  isRetrying?: boolean;
  isReprocessing?: boolean;
}

export default function MediaJobDetailDrawer({
  asset,
  job,
  isOpen,
  onClose,
  onRetryJob,
  onReprocessAsset,
  onDeleteAsset,
  isRetrying = false,
  isReprocessing = false,
}: MediaJobDetailDrawerProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen || (!asset && !job)) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filename = asset?.original?.filename || job?.media_filename || 'Media Asset';
  const assetId = asset?.id || job?.media_id || '';
  const status = asset?.status || job?.status || 'UNKNOWN';
  const isVideo = (asset?.media_type || job?.media_type) === 'VIDEO';

  const originalUrl = asset?.original?.url || job?.media_url;
  const optimizedUrl = asset?.optimized?.url || job?.media_url;
  const originalSize = asset?.original?.size || job?.original_size || 0;
  const optimizedSize = asset?.optimized?.file_size || job?.optimized_size || null;

  const savingsPct =
    optimizedSize && originalSize > 0 && originalSize > optimizedSize
      ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
      : null;

  // Extract logs from job or from asset's associated jobs
  const logs =
    job?.logs && job.logs.length > 0
      ? job.logs
      : asset?.jobs?.[0]?.logs || [];

  const errorMessage = job?.error_message || asset?.jobs?.[0]?.error_message || null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {isVideo ? 'VIDEO' : 'IMAGE'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  status === 'DONE' || status === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : status === 'PROCESSING' || status === 'RETRYING'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {status}
              </span>
            </div>
            <h2 className="text-base font-bold text-white truncate" title={filename}>
              {filename}
            </h2>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">ID: {assetId}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {job && (job.status === 'FAILURE' || job.status === 'ERROR') && onRetryJob && (
              <button
                type="button"
                onClick={() => onRetryJob(job.id)}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            )}

            {asset && onReprocessAsset && (
              <button
                type="button"
                onClick={() => onReprocessAsset(asset.id)}
                disabled={isReprocessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                title="Force re-optimization pipeline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
                <span>Reprocess</span>
              </button>
            )}

            {asset && onDeleteAsset && (
              <button
                type="button"
                onClick={() => onDeleteAsset(asset.id)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 transition-colors cursor-pointer"
                title="Move to Recycle Bin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Visual Media Comparison */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Media Comparison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left: Original */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">Original Source</span>
                  <span className="font-mono text-zinc-400">{formatBytes(originalSize)}</span>
                </div>

                <div className="relative aspect-video rounded-lg bg-black border border-zinc-800 overflow-hidden flex items-center justify-center">
                  {originalUrl ? (
                    isVideo ? (
                      <video src={originalUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <span className="text-xs text-zinc-600">No original preview</span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                  <div>
                    Dimensions:{' '}
                    {asset?.original?.width
                      ? `${asset.original.width}×${asset.original.height}`
                      : 'Auto'}
                  </div>
                  <div>Format: {asset?.original?.content_type || 'octet-stream'}</div>
                  {originalUrl && (
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Raw</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(originalUrl, 'orig')}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                      >
                        {copiedUrl === 'orig' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedUrl === 'orig' ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Optimized Variant */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
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
                      <img
                        src={optimizedUrl}
                        alt="Optimized"
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <span className="text-xs text-zinc-600">Pending optimization</span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                  <div>
                    Quality Score: {asset?.optimized?.quality || job?.media_quality || 'Auto (85)'}
                  </div>
                  <div>Format: {asset?.optimized?.content_type || 'image/avif'}</div>
                  {optimizedUrl && (
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={optimizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Optimized</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(optimizedUrl, 'opt')}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                      >
                        {copiedUrl === 'opt' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedUrl === 'opt' ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Thumbnails */}
          {asset?.thumbnails && asset.thumbnails.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Generated Multi-Resolution Thumbnails</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {asset.thumbnails.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                      <span>{t.size}px</span>
                      {t.quality && <span className="text-blue-400">Q:{t.quality}</span>}
                    </div>
                    <div className="relative aspect-video rounded bg-black overflow-hidden flex items-center justify-center">
                      {t.url ? (
                        <img src={t.url} alt={`thumb-${t.size}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-600">Pending</span>
                      )}
                    </div>
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Open preview</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blurhash Representation */}
          {asset?.blurhash && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-zinc-300">Blurhash Placeholder</div>
                <div className="font-mono text-[11px] text-zinc-500 mt-0.5">{asset.blurhash}</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(asset.blurhash!, 'blurhash')}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
              >
                {copiedUrl === 'blurhash' ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Job Execution Error</span>
              </div>
              <pre className="font-mono text-xs text-red-200/90 whitespace-pre-wrap break-all bg-red-950/40 p-3 rounded-lg border border-red-500/20">
                {errorMessage}
              </pre>
            </div>
          )}

          {/* Pipeline Execution Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Pipeline Stage Timeline</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">{logs.length} stages recorded</span>
            </div>

            {logs.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-500">
                No pipeline stage logs recorded for this job yet.
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/80 overflow-hidden">
                {logs.map((log, idx) => (
                  <div key={idx} className="p-3 sm:px-4 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {log.stage}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-zinc-300 font-mono text-[11px] leading-relaxed break-words">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

