'use client';

import React from 'react';
import { BenchmarkData } from '@/types/media';
import { formatBytes, formatDuration, formatDate } from '@/lib/media-utils';
import {
  Gauge,
  TrendingDown,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface MediaBenchmarksTabProps {
  data: BenchmarkData | null;
  loading: boolean;
  onScanUnoptimized: () => Promise<void>;
  onScanThumbnails: () => Promise<void>;
  isScanningUnoptimized: boolean;
  isScanningThumbnails: boolean;
}

export default function MediaBenchmarksTab({
  data,
  loading,
  onScanUnoptimized,
  onScanThumbnails,
  isScanningUnoptimized,
  isScanningThumbnails,
}: MediaBenchmarksTabProps) {
  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-zinc-400 text-sm">Loading media engine benchmarks...</p>
      </div>
    );
  }

  const global = data?.global;
  const batches = data?.recent_batches || [];
  const formats = global?.format_breakdown || [];

  return (
    <div className="space-y-6">
      {/* Benchmark Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action 1: Scan Unoptimized */}
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-white">Scan Unoptimized Assets</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Triggers a background task to crawl legacy unoptimized images and videos in the database, automatically queueing them into Celery for modern AVIF/WebP transcoding.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">Task: scan_unoptimized_media</span>
            <button
              type="button"
              onClick={onScanUnoptimized}
              disabled={isScanningUnoptimized}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningUnoptimized ? 'animate-spin' : ''}`} />
              <span>{isScanningUnoptimized ? 'Queuing Scan...' : 'Queue Unoptimized Scan'}</span>
            </button>
          </div>
        </div>

        {/* Action 2: Scan Missing Thumbnails */}
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-white">Scan Missing Thumbnails</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Scans all active media assets missing standard 720p masonry cards and 144p blurred placeholders, queueing thumbnail generation tasks in the background.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">Task: scan_missing_thumbnails</span>
            <button
              type="button"
              onClick={onScanThumbnails}
              disabled={isScanningThumbnails}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningThumbnails ? 'animate-spin' : ''}`} />
              <span>{isScanningThumbnails ? 'Queuing Scan...' : 'Queue Thumbnail Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Format Breakdown */}
      {formats.length > 0 && (
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Original Format Ingestion Breakdown</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {global?.total_assets || 0} total assets
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {formats.map((f) => (
              <div
                key={f.original_content_type}
                className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex flex-col justify-between"
              >
                <div className="text-[11px] font-mono text-zinc-400 truncate">
                  {f.original_content_type || 'unknown'}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-white">
                    {f.count.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {formatBytes(f.total_size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Batch Speed Benchmark */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl space-y-2">
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Batch Upload & Processing Latency</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Processing benchmarks across recent multi-file upload batches.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Images</th>
                <th className="py-3 px-4">Total Time</th>
                <th className="py-3 px-4">Avg Per Asset</th>
                <th className="py-3 px-4">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No batch benchmark telemetry recorded yet.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batch_id} className="hover:bg-zinc-850/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-400">
                      {b.batch_id.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-medium">
                      {b.user_handle}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {b.image_count} items
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {formatDuration(b.total_duration_seconds)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {b.avg_per_image !== null ? (
                        <span className="text-emerald-400 font-medium">
                          {b.avg_per_image < 1
                            ? `${Math.round(b.avg_per_image * 1000)}ms`
                            : `${b.avg_per_image.toFixed(2)}s`}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {formatDate(b.start_time)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

