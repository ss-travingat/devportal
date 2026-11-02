'use client';

import React, { useState } from 'react';
import { EngineAsset, EngineJob, EngineJobLog, EngineThumbnailVariant } from '@/types/media';
import { formatBytes, formatDuration, formatDate } from '@/lib/media-utils';
import {
  X,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  ChevronRight,
  Database,
  Eye,
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
  const [logFilter, setLogFilter] = useState<'all' | 'opt' | 'thumb'>('all');

  if (!isOpen || (!asset && !job)) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filename = asset?.original?.filename || job?.media_filename || 'Media Asset';
  const assetId = asset?.id || job?.media_id || '';
  const isVideo = (asset?.media_type || job?.media_type) === 'VIDEO';

  const originalUrl = asset?.original?.url || job?.media_url;
  const optimizedUrl = asset?.optimized?.url || job?.media_url;
  const originalSize = asset?.original?.size || job?.original_size || 0;
  const optimizedSize = asset?.optimized?.file_size || job?.optimized_size || null;

  const savingsPct =
    optimizedSize && originalSize > 0 && originalSize > optimizedSize
      ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
      : null;

  // Extract thumbnails from asset or job stages
  const thumbnails: EngineThumbnailVariant[] =
    job?.thumbnails && job.thumbnails.length > 0
      ? job.thumbnails
      : asset?.thumbnails?.map((t) => ({
        size: t.size,
        url: t.url,
        quality: t.quality,
      })) || [];

  const totalThumbBytes = thumbnails.reduce((acc, t) => acc + (t.file_size || 0), 0);

  // Extract logs from job and asset jobs
  const allLogs: EngineJobLog[] = [
    ...(job?.logs || []),
    ...(asset?.jobs?.flatMap((j) => j.logs || []) || []),
  ].reduce((acc: EngineJobLog[], curr) => {
    if (!acc.some((l) => l.stage === curr.stage && l.timestamp === curr.timestamp)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Filter logs by stage
  const optLogs = allLogs.filter(
    (l) =>
      !['Thumbnails', 'Thumbnail Generation'].includes(l.stage) &&
      !l.message.toLowerCase().includes('thumbnail')
  );
  const thumbLogs = allLogs.filter(
    (l) =>
      ['Thumbnails', 'Thumbnail Generation'].includes(l.stage) ||
      l.message.toLowerCase().includes('thumbnail')
  );

  const displayedLogs =
    logFilter === 'opt' ? optLogs : logFilter === 'thumb' ? thumbLogs : allLogs;

  const errorMessage = job?.error_message || asset?.jobs?.[0]?.error_message || null;

  // Compute stage statuses
  const hasOptimization = Boolean(optimizedSize || asset?.optimized);
  const hasThumbnails = thumbnails.length > 0;
  const jobStatus = job?.status || asset?.status || 'UNKNOWN';

  const optStatus = hasOptimization
    ? 'SUCCESS'
    : jobStatus === 'FAILURE' || jobStatus === 'ERROR'
      ? 'FAILURE'
      : jobStatus;

  const thumbStatus = hasThumbnails
    ? 'SUCCESS'
    : jobStatus === 'PROCESSING'
      ? 'PROCESSING'
      : jobStatus === 'FAILURE'
        ? 'FAILURE'
        : 'PENDING';

  const overallStatus =
    optStatus === 'SUCCESS' && (thumbStatus === 'SUCCESS' || isVideo)
      ? 'SUCCESS'
      : jobStatus;

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
                {isVideo ? 'VIDEO PIPELINE' : 'IMAGE PIPELINE'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${overallStatus === 'DONE' || overallStatus === 'SUCCESS'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : overallStatus === 'PROCESSING' || overallStatus === 'RETRYING'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
              >
                {overallStatus}
              </span>
            </div>
            <h2 className="text-base font-bold text-white truncate" title={filename}>
              {filename}
            </h2>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">Asset ID: {assetId}</p>
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
                title="Force re-run full pipeline"
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
          {/* ── Unified Pipeline Stages: Optimization + Thumbnails ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Unified Pipeline Breakdown</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">2 Stages Merged</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Stage 1: Full-Size Optimization */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                      1
                    </span>
                    <span className="text-xs font-bold text-white">Full-Size Optimization</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${optStatus === 'SUCCESS' || optStatus === 'DONE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : optStatus === 'PROCESSING'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                  >
                    {optStatus}
                  </span>
                </div>

                <div className="text-xs font-mono space-y-1.5 text-zinc-400 pt-1">
                  <div className="flex justify-between">
                    <span>Target Format:</span>
                    <span className="text-zinc-200 font-semibold">{isVideo ? 'WebM / MP4' : 'AVIF'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Size:</span>
                    <span className="text-zinc-200">{formatBytes(originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Optimized Size:</span>
                    <span className="text-emerald-400 font-bold">{formatBytes(optimizedSize)}</span>
                  </div>
                  {savingsPct !== null && (
                    <div className="flex justify-between">
                      <span>Saved:</span>
                      <span className="text-emerald-400 font-bold">-{savingsPct}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="text-zinc-300">
                      {asset?.original?.width
                        ? `${asset.original.width} × ${asset.original.height}`
                        : job?.dimensions || 'Auto-Detected'}
                    </span>
                  </div>
                </div>

                {optimizedUrl && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <a
                      href={optimizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View AVIF</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(optimizedUrl, 'opt_stage')}
                      className="text-zinc-400 hover:text-white"
                    >
                      {copiedUrl === 'opt_stage' ? 'Copied' : 'Copy URL'}
                    </button>
                  </div>
                )}
              </div>

              {/* Stage 2: Thumbnail Transcoding */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                      2
                    </span>
                    <span className="text-xs font-bold text-white">Thumbnail Transcoding</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${thumbStatus === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : thumbStatus === 'PROCESSING'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                  >
                    {thumbnails.length > 0 ? `${thumbnails.length} Sizes Ready` : thumbStatus}
                  </span>
                </div>

                <div className="text-xs font-mono space-y-1.5 text-zinc-400 pt-1">
                  <div className="flex justify-between">
                    <span>Target Variants:</span>
                    <span className="text-zinc-200">720p (Grid) & 144p (Blur)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transcoded:</span>
                    <span className="text-amber-400 font-bold">{thumbnails.length} Sizes</span>
                  </div>
                  {totalThumbBytes > 0 && (
                    <div className="flex justify-between">
                      <span>Total Thumb Size:</span>
                      <span className="text-zinc-300 font-bold">{formatBytes(totalThumbBytes)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Fast-Track Mode:</span>
                    <span className="text-emerald-400">Integrated Pipeline</span>
                  </div>
                </div>

                {thumbnails.length > 0 && thumbnails[0]?.url && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <a
                      href={thumbnails[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View 720p Thumb</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(thumbnails[0].url!, 'thumb_stage')}
                      className="text-zinc-400 hover:text-white"
                    >
                      {copiedUrl === 'thumb_stage' ? 'Copied' : 'Copy URL'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visual Media Comparison */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Media Comparison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left: Original */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">Original Raw</span>
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
                  <div>Format: {asset?.original?.content_type || 'image/raw'}</div>
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
                        <span>{copiedUrl === 'orig' ? 'Copied' : 'Copy'}</span>
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
                  <div>Quality Score: {asset?.optimized?.quality || job?.media_quality || 85}</div>
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
                        <span>{copiedUrl === 'opt' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Multi-Resolution Thumbnails Grid */}
          {thumbnails.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Generated Multi-Resolution Thumbnails ({thumbnails.length})</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {thumbnails.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                      <span className="font-bold text-amber-400">{t.size}px</span>
                      {t.file_size && <span className="text-zinc-400">{formatBytes(t.file_size)}</span>}
                    </div>
                    <div className="relative aspect-video rounded bg-black overflow-hidden flex items-center justify-center">
                      {t.url ? (
                        <img
                          src={t.url}
                          alt={`thumb-${t.size}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs text-zinc-600">Pending</span>
                      )}
                    </div>
                    {t.url && (
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Preview</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(t.url!, `thumb_${t.size}`)}
                          className="text-zinc-400 hover:text-white"
                        >
                          {copiedUrl === `thumb_${t.size}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blurhash Placeholder */}
          {(asset?.blurhash || job?.blurhash) && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-zinc-300">Blurhash Placeholder</div>
                <div className="font-mono text-[11px] text-zinc-500 mt-0.5">
                  {asset?.blurhash || job?.blurhash}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard((asset?.blurhash || job?.blurhash)!, 'blurhash')}
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
                <span>Pipeline Execution Error</span>
              </div>
              <pre className="font-mono text-xs text-red-200/90 whitespace-pre-wrap break-all bg-red-950/40 p-3 rounded-lg border border-red-500/20">
                {errorMessage}
              </pre>
            </div>
          )}

          {/* Pipeline Execution Logs with Stage Filtering Tabs */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Pipeline Stage Timeline</span>
              </h3>

              {/* Stage Filters */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setLogFilter('all')}
                  className={`px-2 py-0.5 rounded transition ${logFilter === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  All ({allLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilter('opt')}
                  className={`px-2 py-0.5 rounded transition ${logFilter === 'opt'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Optimization ({optLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilter('thumb')}
                  className={`px-2 py-0.5 rounded transition ${logFilter === 'thumb'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Thumbnails ({thumbLogs.length})
                </button>
              </div>
            </div>

            {displayedLogs.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-500">
                No pipeline stage logs recorded for this stage yet.
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/80 overflow-hidden">
                {displayedLogs.map((log, idx) => (
                  <div key={idx} className="p-3 sm:px-4 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${log.stage === 'Thumbnails' || log.stage === 'Thumbnail Generation'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            }`}
                        >
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
