'use client';

import React, { useState } from 'react';
import { EngineJob } from '@/types/media';
import { formatBytes, formatDuration, formatDate } from '@/lib/media-utils';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  FileCode,
  Image as ImageIcon,
  Video,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface MediaQueueTabProps {
  jobs: EngineJob[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  jobTypeFilter: string;
  onJobTypeFilterChange: (type: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRetryJob: (jobId: string) => Promise<void>;
  onRetryAll: () => Promise<void>;
  onReconcileStale?: () => Promise<void>;
  isReconcilingStale?: boolean;
  onPurgeFailed?: () => Promise<void>;
  isPurgingFailed?: boolean;
  onDeleteJob?: (jobId: string) => Promise<void>;
  deletingJobId?: string | null;
  onSelectJob: (job: EngineJob) => void;
  isRetryingAll: boolean;
  retryingJobId: string | null;
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  if (s === 'PROCESSING' || s === 'RETRYING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>{s}</span>
      </span>
    );
  }
  if (s === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
        <Clock className="w-3 h-3" />
        <span>PENDING</span>
      </span>
    );
  }
  if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'DONE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3" />
        <span>SUCCESS</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
      <AlertCircle className="w-3 h-3" />
      <span>{s || 'FAILED'}</span>
    </span>
  );
}

export function JobTypeBadge({ type }: { type: string }) {
  const t = (type || '').toUpperCase();
  if (t === 'IMAGE_PROCESSING' || t === 'THUMBNAIL_PROCESSING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
        <span>Image Pipeline</span>
      </span>
    );
  }
  if (t === 'VIDEO_PROCESSING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
        <Video className="w-3.5 h-3.5 text-purple-400" />
        <span>Video Pipeline</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
      <Sparkles className="w-3.5 h-3.5" />
      <span>{type}</span>
    </span>
  );
}

export default function MediaQueueTab({
  jobs,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  jobTypeFilter,
  onJobTypeFilterChange,
  searchQuery,
  onSearchChange,
  onRetryJob,
  onRetryAll,
  onReconcileStale,
  isReconcilingStale,
  onPurgeFailed,
  isPurgingFailed,
  onDeleteJob,
  deletingJobId,
  onSelectJob,
  isRetryingAll,
  retryingJobId,
}: MediaQueueTabProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasFailedJobs = jobs.some(
    (j) => j.status === 'FAILURE' || j.status === 'ERROR' || j.status === 'RETRYING'
  );

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: '', label: 'All Jobs' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'PENDING', label: 'Queued' },
            { id: 'FAILURE', label: 'Failed' },
            { id: 'SUCCESS', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side: Type Filter + Search + Retry All */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={jobTypeFilter}
              onChange={(e) => onJobTypeFilterChange(e.target.value)}
              className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 outline-none cursor-pointer pr-7 appearance-none"
            >
              <option value="">All Pipelines</option>
              <option value="IMAGE_PROCESSING">Image Pipeline (Full + Thumbnails)</option>
              <option value="VIDEO_PROCESSING">Video Pipeline</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/90 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {hasFailedJobs && (
            <button
              onClick={onRetryAll}
              disabled={isRetryingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-200 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetryingAll ? 'animate-spin' : ''}`} />
              <span>{isRetryingAll ? 'Retrying All...' : 'Retry All Failed'}</span>
            </button>
          )}

          {hasFailedJobs && onPurgeFailed && (
            <button
              onClick={onPurgeFailed}
              disabled={isPurgingFailed}
              title="Purge all failed test/404 jobs and orphaned records permanently"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className={`w-3.5 h-3.5 ${isPurgingFailed ? 'animate-pulse' : ''}`} />
              <span>{isPurgingFailed ? 'Purging...' : 'Purge Failed (404) Jobs'}</span>
            </button>
          )}

          {onReconcileStale && (
            <button
              onClick={onReconcileStale}
              disabled={isReconcilingStale}
              title="Auto-reconciles jobs stuck in processing that already completed or timed out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconcilingStale ? 'animate-spin' : ''}`} />
              <span>{isReconcilingStale ? 'Reconciling...' : 'Reconcile Stuck Jobs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Jobs List / Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Media</th>
                <th className="py-3.5 px-4">Job Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Size & Ratio</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                      <span>Loading queue jobs...</span>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-zinc-600" />
                      <span className="text-zinc-300 font-medium">No queue jobs found</span>
                      <span className="text-xs text-zinc-500">
                        {searchQuery || statusFilter || jobTypeFilter
                          ? 'Try clearing filters to see more results.'
                          : 'The processing queue is currently idle.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isRetrying = retryingJobId === job.id;
                  const originalSize = job.original_size || 0;
                  const optimizedSize = job.optimized_size || null;
                  const hasSavings =
                    optimizedSize && originalSize > 0 && originalSize > optimizedSize;
                  const savingsPct = hasSavings
                    ? Math.round(((originalSize - optimizedSize!) / originalSize) * 100)
                    : null;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="hover:bg-zinc-850/60 transition-colors cursor-pointer group"
                    >
                      {/* Media column */}
                      <td className="py-3 px-4 max-w-[260px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 overflow-hidden flex items-center justify-center shrink-0">
                            {job.media_url ? (
                              /\.(mp4|mov|webm)$/i.test(job.media_url) ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : (
                                <img
                                  src={job.media_url}
                                  alt={job.media_filename || 'media'}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              )
                            ) : (
                              <ImageIcon className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-200 truncate group-hover:text-blue-300 transition-colors" title={job.media_filename || 'Unknown'}>
                              {job.media_filename || 'Unnamed Media'}
                            </div>
                            <div className="font-mono text-[10px] text-zinc-500 truncate" title={job.id}>
                              ID: {job.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Type */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <JobTypeBadge type={job.job_type} />
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                            <span className="text-emerald-400">● Full Opt</span>
                            <span>•</span>
                            <span className="text-amber-400">
                              {job.thumbnails && job.thumbnails.length > 0
                                ? `${job.thumbnails.length} Thumbs`
                                : '● Thumbs'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={job.status} />
                          {job.error_message && (
                            <p
                              className="text-[10px] text-red-400/90 truncate max-w-[180px]"
                              title={job.error_message}
                            >
                              {job.error_message}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Size & Ratio */}
                      <td className="py-3 px-4 font-mono">
                        {originalSize > 0 ? (
                          <div>
                            <span className="text-zinc-300">{formatBytes(originalSize)}</span>
                            {optimizedSize && (
                              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                                <span>→ {formatBytes(optimizedSize)}</span>
                                {savingsPct !== null && (
                                  <span className="px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                                    -{savingsPct}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {formatDuration(job.duration_seconds)}
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-zinc-400">
                        {formatDate(job.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(job.status === 'FAILURE' ||
                            job.status === 'ERROR' ||
                            job.status === 'RETRYING') && (
                              <button
                                type="button"
                                onClick={() => onRetryJob(job.id)}
                                disabled={isRetrying}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Retry job"
                              >
                                <RotateCcw
                                  className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`}
                                />
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onSelectJob(job)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-md border border-zinc-700 transition-colors cursor-pointer text-xs font-medium"
                          >
                            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Logs</span>
                          </button>

                          {onDeleteJob && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete job ${job.id.slice(0, 8)}... from queue?`)) {
                                  onDeleteJob(job.id);
                                }
                              }}
                              disabled={deletingJobId === job.id}
                              className="p-1.5 bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded-md border border-zinc-700 hover:border-rose-500/40 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete job from queue"
                            >
                              <Trash2
                                className={`w-3.5 h-3.5 ${deletingJobId === job.id ? 'animate-pulse text-rose-500' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-zinc-900/90 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div>
            Showing <strong className="text-zinc-200">{jobs.length}</strong> of{' '}
            <strong className="text-zinc-200">{totalCount}</strong> jobs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="font-mono text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
