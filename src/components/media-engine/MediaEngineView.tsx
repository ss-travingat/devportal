'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EngineStats,
  EngineJob,
  EngineAsset,
  BenchmarkData,
} from '@/types/media';
import MediaMetricsCards from './MediaMetricsCards';
import MediaQueueTab from './MediaQueueTab';
import MediaAssetsTab from './MediaAssetsTab';
import MediaRecycleBinTab from './MediaRecycleBinTab';
import MediaBenchmarksTab from './MediaBenchmarksTab';
import MediaJobDetailDrawer from './MediaJobDetailDrawer';
import MediaTestUploadModal from './MediaTestUploadModal';
import {
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Trash2,
  Gauge,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';

type TabKey = 'queue' | 'assets' | 'recycle' | 'benchmarks';

export default function MediaEngineView() {
  const queryClient = useQueryClient();

  // Active top tab
  const [activeTab, setActiveTab] = useState<TabKey>('queue');

  // Queue state
  const [queuePage, setQueuePage] = useState(1);
  const [queueStatusFilter, setQueueStatusFilter] = useState('');
  const [queueJobTypeFilter, setQueueJobTypeFilter] = useState('');
  const [queueSearch, setQueueSearch] = useState('');

  // Assets state
  const [assetsPage, setAssetsPage] = useState(1);
  const [assetsTypeFilter, setAssetsTypeFilter] = useState('');
  const [assetsStatusFilter, setAssetsStatusFilter] = useState('');
  const [assetsSearch, setAssetsSearch] = useState('');

  // Auto-sync polling mode: 'live' (3s), 'normal' (10s), 'off'
  const [syncMode, setSyncMode] = useState<'live' | 'normal' | 'off'>('live');

  // Notification toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Selected asset / job for Drawer Inspector
  const [selectedAsset, setSelectedAsset] = useState<EngineAsset | null>(null);
  const [selectedJob, setSelectedJob] = useState<EngineJob | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Test upload modal
  const [isTestUploadOpen, setIsTestUploadOpen] = useState(false);

  // Action loading states
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // ── 1. Query: Stats ─────────────────────────────────────────────
    const {
      data: stats,
      isLoading: isStatsLoading,
      isError: isStatsError,
      error: statsError,
      refetch: refetchStats,
    } = useQuery<EngineStats>({
      queryKey: ['media-engine', 'stats'],
      queryFn: async () => {
        const res = await fetch('/api/media-engine/stats');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}: Failed to load stats`);
        }
        return res.json();
      },
      refetchInterval: syncMode === 'live' ? 5000 : syncMode === 'normal' ? 15000 : false,
    });

    // ── 2. Query: Queue ─────────────────────────────────────────────
    const hasProcessingJobs =
      (stats?.job_counts?.processing || 0) > 0 || (stats?.job_counts?.pending || 0) > 0;

    const queueRefetchInterval =
      syncMode === 'off'
        ? false
        : syncMode === 'live'
          ? hasProcessingJobs
            ? 3000
            : 6000
          : 15000;

      const {
        data: queueData,
        isLoading: isQueueLoading,
        isError: isQueueError,
        error: queueError,
        refetch: refetchQueue,
      } = useQuery({
        queryKey: [
          'media-engine',
          'queue',
          queuePage,
          queueStatusFilter,
          queueJobTypeFilter,
          queueSearch,
        ],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set('page', String(queuePage));
          params.set('page_size', '20');
          if (queueStatusFilter) params.set('status', queueStatusFilter);
          if (queueJobTypeFilter) params.set('job_type', queueJobTypeFilter);
          if (queueSearch) params.set('search', queueSearch);

          const res = await fetch(`/api/media-engine/queue?${params.toString()}`);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}: Failed to load queue`);
          }
          return res.json();
        },
        refetchInterval: queueRefetchInterval,
      });

      const jobs: EngineJob[] = Array.isArray(queueData)
        ? queueData
        : queueData?.results || [];
      const queueTotalCount: number =
      typeof queueData?.count === 'number' ? queueData.count : jobs.length;

      // ── 3. Query: Assets ────────────────────────────────────────────
      const { data: assetsData, isLoading: isAssetsLoading } = useQuery({
        queryKey: [
          'media-engine',
          'assets',
          assetsPage,
          assetsTypeFilter,
          assetsStatusFilter,
          assetsSearch,
        ],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set('page', String(assetsPage));
          params.set('page_size', '20');
          if (assetsTypeFilter) params.set('media_type', assetsTypeFilter);
          if (assetsStatusFilter) params.set('status', assetsStatusFilter);
          if (assetsSearch) params.set('search', assetsSearch);

          const res = await fetch(`/api/media-engine/assets?${params.toString()}`);
          if (!res.ok) throw new Error('Failed to load assets');
          return res.json();
        },
      });

      const assets: EngineAsset[] = Array.isArray(assetsData)
        ? assetsData
        : assetsData?.results || [];
      const assetsTotalCount: number =
      typeof assetsData?.count === 'number' ? assetsData.count : assets.length;

      // ── 4. Query: Recycle Bin ───────────────────────────────────────
      const { data: recycleData, isLoading: isRecycleLoading } = useQuery({
        queryKey: ['media-engine', 'recycle-bin'],
        queryFn: async () => {
          const res = await fetch('/api/media-engine/recycle-bin');
          if (!res.ok) throw new Error('Failed to load recycle bin');
          return res.json();
        },
      });

      const recycleItems: EngineAsset[] = Array.isArray(recycleData)
        ? recycleData
        : recycleData?.results || [];
      const recycleTotalCount: number =
      typeof recycleData?.count === 'number' ? recycleData.count : recycleItems.length;

      // ── 5. Query: Benchmarks ────────────────────────────────────────
      const { data: benchmarksData, isLoading: isBenchmarksLoading } = useQuery<BenchmarkData>({
        queryKey: ['media-engine', 'benchmarks'],
        queryFn: async () => {
          const res = await fetch('/api/media-engine/benchmarks');
          if (!res.ok) throw new Error('Failed to load benchmarks');
          return res.json();
        },
        enabled: activeTab === 'benchmarks',
      });

      // ── Mutations ───────────────────────────────────────────────────

      // Retry single job
      const retryJobMutation = useMutation({
        mutationFn: async (jobId: string) => {
          setRetryingJobId(jobId);
          const res = await fetch(`/api/media-engine/queue/${jobId}/retry`, {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to retry job');
          return data;
        },
        onSuccess: () => {
          showFeedback('success', 'Job successfully queued for retry.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
        onSettled: () => setRetryingJobId(null),
      });

      // Retry all failed jobs
      const retryAllMutation = useMutation({
        mutationFn: async () => {
          const res = await fetch('/api/media-engine/queue/retry-all', {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to retry all jobs');
          return data;
        },
        onSuccess: (data) => {
          showFeedback('success', data.status || 'All failed jobs queued for retry.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
      });

      // Reconcile stuck processing jobs
      const reconcileStaleMutation = useMutation({
        mutationFn: async () => {
          const res = await fetch('/api/media-engine/queue/reconcile-stale', {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to reconcile stuck jobs');
          return data;
        },
        onSuccess: (data) => {
          showFeedback(
            'success',
            `Reconciliation complete: ${data.reconciled_success || 0} resolved to success, ${data.marked_failed || 0} timed out.`
          );
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
      });

      // Reprocess asset
      const reprocessAssetMutation = useMutation({
        mutationFn: async (assetId: string) => {
          setReprocessingId(assetId);
          const res = await fetch(`/api/media-engine/assets/${assetId}/reprocess`, {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to trigger reprocess');
          return data;
        },
        onSuccess: () => {
          showFeedback('success', 'Reprocess pipeline task queued.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
        onSettled: () => setReprocessingId(null),
      });

      // Soft delete asset to recycle bin
      const deleteAssetMutation = useMutation({
        mutationFn: async (assetId: string) => {
          setDeletingId(assetId);
          const res = await fetch(`/api/media-engine/assets/${assetId}`, {
            method: 'DELETE',
          });
          if (res.status === 204) return;
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to delete asset');
        },
        onSuccess: () => {
          showFeedback('success', 'Asset moved to recycle bin.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
          if (isDrawerOpen) setIsDrawerOpen(false);
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
        onSettled: () => setDeletingId(null),
      });

      // Restore asset from recycle bin
      const restoreAssetMutation = useMutation({
        mutationFn: async (assetId: string) => {
          setRestoringId(assetId);
          const res = await fetch(`/api/media-engine/assets/${assetId}/restore`, {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to restore asset');
          return data;
        },
        onSuccess: () => {
          showFeedback('success', 'Asset restored successfully.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
        onSettled: () => setRestoringId(null),
      });

      // Permanent hard delete
      const hardDeleteMutation = useMutation({
        mutationFn: async (assetId: string) => {
          if (
            !confirm(
              'Are you sure you want to permanently delete this media file from storage? This cannot be undone.'
            )
          ) {
            return;
          }
          setDeletingId(assetId);
          const res = await fetch(`/api/media-engine/assets/${assetId}/hard-delete`, {
            method: 'DELETE',
          });
          if (res.status === 204) return;
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to permanently delete');
        },
        onSuccess: () => {
          showFeedback('success', 'Asset and variants permanently deleted.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
        onSettled: () => setDeletingId(null),
      });

      // Empty recycle bin
      const emptyRecycleBinMutation = useMutation({
        mutationFn: async () => {
          if (
            !confirm(
              'Are you sure you want to permanently purge all items in the recycle bin? All raw and optimized media will be deleted forever.'
            )
          ) {
            return;
          }
          const res = await fetch('/api/media-engine/recycle-bin', {
            method: 'DELETE',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to empty recycle bin');
          return data;
        },
        onSuccess: (data) => {
          showFeedback('success', data.status || 'Recycle bin emptied successfully.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
      });

      // Scan unoptimized
      const scanUnoptimizedMutation = useMutation({
        mutationFn: async () => {
          const res = await fetch('/api/media-engine/actions/scan-unoptimized', {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to trigger unoptimized scan');
          return data;
        },
        onSuccess: () => {
          showFeedback('success', 'Background scan for unoptimized media queued.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
      });

      // Scan thumbnails
      const scanThumbnailsMutation = useMutation({
        mutationFn: async () => {
          const res = await fetch('/api/media-engine/actions/scan-missing-thumbnails', {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Failed to trigger thumbnail scan');
          return data;
        },
        onSuccess: () => {
          showFeedback('success', 'Background scan for missing thumbnails queued.');
          queryClient.invalidateQueries({ queryKey: ['media-engine'] });
        },
        onError: (err: Error) => {
          showFeedback('error', err.message);
        },
      });

      // Handle drawer inspection
      const handleSelectJob = async (job: EngineJob) => {
        setSelectedJob(job);
        setSelectedAsset(null);
        setIsDrawerOpen(true);

        if (job.media_id) {
          try {
            const res = await fetch(`/api/media-engine/assets/${job.media_id}`);
            if (res.ok) {
              const assetData = await res.json();
              setSelectedAsset(assetData);
            }
          } catch {
            // Keep job details
          }
        }
      };

      const handleSelectAsset = (asset: EngineAsset) => {
        setSelectedAsset(asset);
        setSelectedJob(asset.jobs?.[0] || null);
        setIsDrawerOpen(true);
      };

      return(
    <div className = "space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" >
          {/* Top Banner & Control Center */ }
          < div className = "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800" >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <span className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 inline-flex">
                    <Cpu className="w-5 h-5" />
                  </span>
                  <span>Media Engine</span>
                </h1>

                {/* Live Sync Status Pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800">
                  <span
                    className={`w-2 h-2 rounded-full ${syncMode === 'live'
                      ? 'bg-emerald-400 animate-pulse'
                      : syncMode === 'normal'
                        ? 'bg-blue-400'
                        : 'bg-zinc-600'
                      }`}
                  />
                  <span className="text-zinc-300">
                    {syncMode === 'live'
                      ? 'Live Auto-Sync'
                      : syncMode === 'normal'
                        ? 'Sync (10s)'
                        : 'Paused'}
                  </span>

                  {/* Toggle sync modes */}
                  <button
                    type="button"
                    onClick={() =>
                      setSyncMode((prev) =>
                        prev === 'live' ? 'normal' : prev === 'normal' ? 'off' : 'live'
                      )
                    }
                    className="text-[10px] text-zinc-500 hover:text-white underline ml-1 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-1.5">
                Production image & video optimization pipeline, Celery background queues, and variant storage analytics.
              </p>
            </div>

        {/* Global Toolbar Actions */ }
        <div className = "flex flex-wrap items-center gap-2.5" >
          <button
            type="button"
            onClick={() => setIsTestUploadOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Test Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['media-engine'] })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Refresh all data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div >
      </div >

    {/* Toast Feedback */ }
  {
    feedback && (
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2 ${feedback.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
      >
        <div className="flex items-center gap-2">
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
        <button
          onClick={() => setFeedback(null)}
          className="text-zinc-400 hover:text-white cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    )
  }

  {/* Backend Communication Error Banner */ }
  {
    (isStatsError || isQueueError) && (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-semibold text-red-100">Media Engine Backend Unavailable</p>
            <p className="text-xs text-red-300/80">
              {(statsError as Error)?.message || (queueError as Error)?.message || 'Failed to communicate with media engine backend API.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            refetchStats();
            refetchQueue();
          }}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-semibold transition"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  {/* Metrics Cards */ }
  <MediaMetricsCards stats={stats || null} loading={isStatsLoading} />

  {/* Main Navigation Tabs */ }
  <div className="space-y-6">
    <div className="border-b border-zinc-800 flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('queue')}
          className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${activeTab === 'queue'
            ? 'border-blue-500 text-white bg-blue-500/5'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Processing Queue</span>
          {(stats?.job_counts?.processing || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[10px] font-bold animate-pulse">
              {stats?.job_counts?.processing}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${activeTab === 'assets'
            ? 'border-blue-500 text-white bg-blue-500/5'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Media Library</span>
          <span className="text-[11px] font-mono text-zinc-500">
            ({(stats?.total_media || 0).toLocaleString()})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recycle')}
          className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${activeTab === 'recycle'
            ? 'border-red-500 text-red-300 bg-red-500/5'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Recycle Bin</span>
          {recycleTotalCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold">
              {recycleTotalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${activeTab === 'benchmarks'
            ? 'border-blue-500 text-white bg-blue-500/5'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Benchmarks & Diagnostics</span>
        </button>
      </div>
    </div>

    {/* Tab Content Panes */}
    {activeTab === 'queue' && (
      <MediaQueueTab
        jobs={jobs}
        loading={isQueueLoading}
        totalCount={queueTotalCount}
        page={queuePage}
        pageSize={20}
        onPageChange={setQueuePage}
        statusFilter={queueStatusFilter}
        onStatusFilterChange={(s) => {
          setQueueStatusFilter(s);
          setQueuePage(1);
        }}
        jobTypeFilter={queueJobTypeFilter}
        onJobTypeFilterChange={(t) => {
          setQueueJobTypeFilter(t);
          setQueuePage(1);
        }}
        searchQuery={queueSearch}
        onSearchChange={(q) => {
          setQueueSearch(q);
          setQueuePage(1);
        }}
        onRetryJob={async (jobId) => {
          await retryJobMutation.mutateAsync(jobId);
        }}
        onRetryAll={async () => {
          await retryAllMutation.mutateAsync();
        }}
        onReconcileStale={async () => {
          await reconcileStaleMutation.mutateAsync();
        }}
        isReconcilingStale={reconcileStaleMutation.isPending}
        onSelectJob={handleSelectJob}
        isRetryingAll={retryAllMutation.isPending}
        retryingJobId={retryingJobId}
      />
    )}

    {activeTab === 'assets' && (
      <MediaAssetsTab
        assets={assets}
        loading={isAssetsLoading}
        totalCount={assetsTotalCount}
        page={assetsPage}
        pageSize={20}
        onPageChange={setAssetsPage}
        mediaTypeFilter={assetsTypeFilter}
        onMediaTypeFilterChange={(t) => {
          setAssetsTypeFilter(t);
          setAssetsPage(1);
        }}
        statusFilter={assetsStatusFilter}
        onStatusFilterChange={(s) => {
          setAssetsStatusFilter(s);
          setAssetsPage(1);
        }}
        searchQuery={assetsSearch}
        onSearchChange={(q) => {
          setAssetsSearch(q);
          setAssetsPage(1);
        }}
        onSelectAsset={handleSelectAsset}
        onDeleteAsset={async (id) => {
          await deleteAssetMutation.mutateAsync(id);
        }}
        onReprocessAsset={async (id) => {
          await reprocessAssetMutation.mutateAsync(id);
        }}
        reprocessingId={reprocessingId}
        deletingId={deletingId}
      />
    )}

    {activeTab === 'recycle' && (
      <MediaRecycleBinTab
        items={recycleItems}
        loading={isRecycleLoading}
        totalCount={recycleTotalCount}
        onRestore={async (id) => {
          await restoreAssetMutation.mutateAsync(id);
        }}
        onHardDelete={async (id) => {
          await hardDeleteMutation.mutateAsync(id);
        }}
        onEmptyRecycleBin={async () => {
          await emptyRecycleBinMutation.mutateAsync();
        }}
        restoringId={restoringId}
        deletingId={deletingId}
        isEmptying={emptyRecycleBinMutation.isPending}
      />
    )}

    {activeTab === 'benchmarks' && (
      <MediaBenchmarksTab
        data={benchmarksData || null}
        loading={isBenchmarksLoading}
        onScanUnoptimized={async () => {
          await scanUnoptimizedMutation.mutateAsync();
        }}
        onScanThumbnails={async () => {
          await scanThumbnailsMutation.mutateAsync();
        }}
        isScanningUnoptimized={scanUnoptimizedMutation.isPending}
        isScanningThumbnails={scanThumbnailsMutation.isPending}
      />
    )}
  </div>

  {/* Drawer Inspector */ }
  <MediaJobDetailDrawer
    asset={selectedAsset}
    job={selectedJob}
    isOpen={isDrawerOpen}
    onClose={() => setIsDrawerOpen(false)}
    onRetryJob={async (jobId) => {
      await retryJobMutation.mutateAsync(jobId);
    }}
    onReprocessAsset={async (assetId) => {
      await reprocessAssetMutation.mutateAsync(assetId);
    }}
    onDeleteAsset={async (assetId) => {
      await deleteAssetMutation.mutateAsync(assetId);
    }}
    isRetrying={retryJobMutation.isPending}
    isReprocessing={reprocessAssetMutation.isPending}
  />

  {/* Test Upload Modal */ }
  <MediaTestUploadModal
    isOpen={isTestUploadOpen}
    onClose={() => setIsTestUploadOpen(false)}
    onUploadSuccess={(assetId) => {
      showFeedback('success', `Created asset ${assetId}. Optimization queued.`);
      queryClient.invalidateQueries({ queryKey: ['media-engine'] });
      setActiveTab('queue');
    }}
  />
    </div >
  );
}
