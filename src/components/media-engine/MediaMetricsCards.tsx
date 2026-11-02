'use client';

import React from 'react';
import { EngineStats } from '@/types/media';
import { formatBytes } from '@/lib/media-utils';
import {
  Cpu,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingDown,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

interface MediaMetricsCardsProps {
  stats: EngineStats | null;
  loading: boolean;
}

export default function MediaMetricsCards({ stats, loading }: MediaMetricsCardsProps) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800" />
            <div className="h-6 w-24 bg-zinc-800 rounded" />
            <div className="h-4 w-32 bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const originalSize = stats?.original_size || 0;
  const optimizedSize = stats?.optimized_size || 0;
  const thumbSize = stats?.thumb_size || 0;
  const savedBytes = stats?.saved_bytes || 0;
  const savingsPct = stats?.savings_pct || 0;

  const jobCounts = stats?.job_counts || {
    pending: 0,
    processing: 0,
    success: 0,
    failure: 0,
    retrying: 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Assets */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Assets
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {(stats?.total_media || 0).toLocaleString()}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>{(stats?.images_count || 0).toLocaleString()} images</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>{(stats?.videos_count || 0).toLocaleString()} videos</span>
          </div>
        </div>
      </div>

      {/* Card 2: Storage Savings */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Storage Saved
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {formatBytes(savedBytes)}
            </span>
            <span className="text-xs font-bold text-emerald-400/90 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              -{savingsPct}%
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
          <span>Raw: <strong className="text-zinc-300 font-mono">{formatBytes(originalSize)}</strong></span>
          <span>Opt: <strong className="text-zinc-300 font-mono">{formatBytes(optimizedSize)}</strong></span>
        </div>
      </div>

      {/* Card 3: Queue Health */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Queue Health
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-blue-400 font-mono">
              <span className={`w-2 h-2 rounded-full ${jobCounts.processing > 0 ? 'bg-blue-400 animate-ping' : 'bg-blue-500/40'}`} />
              <span className="text-2xl font-bold">{jobCounts.processing}</span>
              <span className="text-xs text-zinc-400">running</span>
            </div>
            {jobCounts.failure > 0 && (
              <div className="flex items-center gap-1.5 text-red-400 font-mono ml-auto">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-bold">{jobCounts.failure} failed</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1 text-yellow-400/90">
            <Clock className="w-3.5 h-3.5" />
            {jobCounts.pending} queued
          </span>
          <span className="flex items-center gap-1 text-emerald-400/90">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {jobCounts.success} completed
          </span>
        </div>
      </div>

      {/* Card 4: Variant Distribution */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Thumbnails & Cache
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatBytes(thumbSize)}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
          <span>Target: <strong className="text-zinc-300 font-mono">720p / 144p</strong></span>
          <span className="text-emerald-400 font-medium">Auto-Transcoded</span>
        </div>
      </div>
    </div>
  );
}

