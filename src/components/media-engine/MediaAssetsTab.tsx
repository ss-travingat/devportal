'use client';

import React, { useState } from 'react';
import { EngineAsset } from '@/types/media';
import { formatBytes, formatDate } from '@/lib/media-utils';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface MediaAssetsTabProps {
  assets: EngineAsset[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  mediaTypeFilter: string;
  onMediaTypeFilterChange: (type: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAsset: (asset: EngineAsset) => void;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onReprocessAsset: (assetId: string) => Promise<void>;
  reprocessingId: string | null;
  deletingId: string | null;
}

export default function MediaAssetsTab({
  assets,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  mediaTypeFilter,
  onMediaTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  onSelectAsset,
  onDeleteAsset,
  onReprocessAsset,
  reprocessingId,
  deletingId,
}: MediaAssetsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Type & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Media Type */}
          <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/60">
            {[
              { id: '', label: 'All Media' },
              { id: 'IMAGE', label: 'Images' },
              { id: 'VIDEO', label: 'Videos' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onMediaTypeFilterChange(t.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mediaTypeFilter === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 outline-none cursor-pointer pr-7 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="DONE">Done / Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="ERROR">Error</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right side: Search + View Switch */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/90 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center p-1 bg-zinc-800/80 rounded-lg border border-zinc-700/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Grid or Table */}
      {loading && assets.length === 0 ? (
        <div className="p-16 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-zinc-400 text-sm">Loading media assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="p-16 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-center justify-center gap-3 text-center">
          <ImageIcon className="w-10 h-10 text-zinc-600" />
          <h3 className="text-zinc-200 font-semibold">No media assets found</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            {searchQuery || mediaTypeFilter || statusFilter
              ? 'Try modifying your search query or filters.'
              : 'No assets have been processed through the Media Engine yet.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {assets.map((asset) => {
            const isDeleting = deletingId === asset.id;
            const isReprocessing = reprocessingId === asset.id;
            const originalSize = asset.original?.size || 0;
            const optimizedSize = asset.optimized?.file_size || null;
            const previewUrl =
              asset.optimized?.url ||
              asset.thumbnails?.[0]?.url ||
              asset.original?.url;
            const isVideo = asset.media_type === 'VIDEO';
            const savings =
              optimizedSize && originalSize > 0 && originalSize > optimizedSize
                ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
                : null;

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="group relative flex flex-col bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer"
              >
                {/* Media Preview Aspect Box */}
                <div className="relative aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    isVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white/80 drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={asset.original?.filename || 'Asset'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <ImageIcon className="w-8 h-8 text-zinc-600" />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10 text-white">
                      {asset.media_type}
                    </span>
                    {asset.optimized?.quality && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/80 text-white font-semibold">
                        Q:{asset.optimized.quality}
                      </span>
                    )}
                  </div>

                  {savings !== null && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/90 text-white">
                        -{savings}%
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Quick Actions */}
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectAsset(asset)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 transition-colors"
                      title="Inspect details & logs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onReprocessAsset(asset.id)}
                      disabled={isReprocessing}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 border border-zinc-600 transition-colors disabled:opacity-50"
                      title="Force reprocess"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isReprocessing ? 'animate-spin' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteAsset(asset.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 transition-colors disabled:opacity-50"
                      title="Move to Recycle Bin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3 space-y-1.5 bg-zinc-900">
                  <div
                    className="font-semibold text-xs text-zinc-200 truncate group-hover:text-blue-300 transition-colors"
                    title={asset.original?.filename}
                  >
                    {asset.original?.filename || 'Unnamed'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>{formatBytes(originalSize)}</span>
                    {optimizedSize ? (
                      <span className="text-emerald-400">{formatBytes(optimizedSize)}</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dimensions</th>
                  <th className="py-3.5 px-4">Raw Size</th>
                  <th className="py-3.5 px-4">Optimized Size</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {assets.map((asset) => {
                  const isDeleting = deletingId === asset.id;
                  const isReprocessing = reprocessingId === asset.id;
                  const originalSize = asset.original?.size || 0;
                  const optimizedSize = asset.optimized?.file_size || null;
                  const previewUrl =
                    asset.optimized?.url ||
                    asset.thumbnails?.[0]?.url ||
                    asset.original?.url;
                  const isVideo = asset.media_type === 'VIDEO';

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => onSelectAsset(asset)}
                      className="hover:bg-zinc-850/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 overflow-hidden flex items-center justify-center shrink-0">
                            {previewUrl ? (
                              isVideo ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : (
                                <img
                                  src={previewUrl}
                                  alt={asset.original?.filename || 'media'}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              )
                            ) : (
                              <ImageIcon className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-200 truncate group-hover:text-blue-300 transition-colors">
                              {asset.original?.filename || 'Unnamed Asset'}
                            </div>
                            <div className="font-mono text-[10px] text-zinc-500 truncate">
                              ID: {asset.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {asset.media_type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            asset.status === 'DONE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : asset.status === 'PROCESSING'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {asset.original?.width && asset.original?.height
                          ? `${asset.original.width}×${asset.original.height}`
                          : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {formatBytes(originalSize)}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {optimizedSize ? (
                          <div className="text-emerald-400 flex items-center gap-1.5">
                            <span>{formatBytes(optimizedSize)}</span>
                            {originalSize > optimizedSize && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                -{Math.round(((originalSize - optimizedSize) / originalSize) * 100)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-400">
                        {formatDate(asset.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onReprocessAsset(asset.id)}
                            disabled={isReprocessing}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-md border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Force reprocess"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAsset(asset.id)}
                            disabled={isDeleting}
                            className="p-1.5 bg-zinc-800 hover:bg-red-500/20 text-red-400 rounded-md border border-zinc-700 hover:border-red-500/40 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Move to Recycle Bin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-400">
        <div>
          Showing <strong className="text-zinc-200">{assets.length}</strong> of{' '}
          <strong className="text-zinc-200">{totalCount}</strong> assets
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
  );
}

