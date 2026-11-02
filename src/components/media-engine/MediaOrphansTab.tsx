'use client';

import React, { useState, useMemo } from 'react';
import { OrphanScanResult, OrphanFile } from '@/types/media';
import { formatBytes, formatDate } from '@/lib/media-utils';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Search,
  CheckSquare,
  Square,
  ExternalLink,
  Video,
  Image as ImageIcon,
  ShieldAlert,
  HardDrive,
  FileQuestion,
  CheckCircle2,
} from 'lucide-react';

interface MediaOrphansTabProps {
  result: OrphanScanResult | null;
  loading: boolean;
  deleting: boolean;
  onScan: () => void;
  onDelete: (keys: string[]) => Promise<void>;
}

export default function MediaOrphansTab({
  result,
  loading,
  deleting,
  onScan,
  onDelete,
}: MediaOrphansTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Filter orphans by search query (filename or path)
  const filteredOrphans = useMemo(() => {
    if (!result?.orphans) return [];
    if (!searchQuery.trim()) return result.orphans;
    const q = searchQuery.toLowerCase().trim();
    return result.orphans.filter(
      (o) => o.key.toLowerCase().includes(q) || o.url.toLowerCase().includes(q)
    );
  }, [result?.orphans, searchQuery]);

  const allFilteredSelected =
    filteredOrphans.length > 0 &&
    filteredOrphans.every((o) => selectedKeys.has(o.key));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredOrphans.map((o) => o.key)));
    }
  };

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedKeys.size === 0) return;
    const count = selectedKeys.size;
    if (
      !confirm(
        `Are you sure you want to permanently delete ${count} selected orphaned file${
          count !== 1 ? 's' : ''
        } from R2 storage? This cannot be undone.`
      )
    ) {
      return;
    }
    const keys = Array.from(selectedKeys);
    await onDelete(keys);
    setSelectedKeys(new Set());
  };

  const handleDeleteAll = async () => {
    if (!result?.orphans?.length) return;
    const count = result.totalOrphaned;
    if (
      !confirm(
        `Are you sure you want to permanently delete all ${count} orphaned file${
          count !== 1 ? 's' : ''
        } (${formatBytes(result.totalOrphanedBytes)}) from R2 storage? This cannot be undone.`
      )
    ) {
      return;
    }
    await onDelete(result.orphans.map((o) => o.key));
    setSelectedKeys(new Set());
  };

  const handleDeleteSingle = async (orphan: OrphanFile) => {
    const filename = orphan.key.split('/').pop() || orphan.key;
    if (
      !confirm(
        `Permanently delete "${filename}" (${formatBytes(
          orphan.size
        )}) from storage? This cannot be undone.`
      )
    ) {
      return;
    }
    await onDelete([orphan.key]);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(orphan.key);
      return next;
    });
  };

  const isVideo = (url: string) => /\.(mp4|mov|webm|m4v)$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Notice Banner & Metrics Summary */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Orphaned Media Cleanup</span>
                {result && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      result.totalOrphaned > 0
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {result.totalOrphaned > 0
                      ? `${result.totalOrphaned} orphaned`
                      : 'Clean'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Detects unreferenced files in Cloudflare R2 storage that were uploaded during draft sessions or deleted profiles without being referenced in production databases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onScan}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning R2...' : result ? 'Re-scan Storage' : 'Scan Storage'}</span>
            </button>

            {result && result.totalOrphaned > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${deleting ? 'animate-spin' : ''}`} />
                <span>{deleting ? 'Deleting...' : `Delete All (${result.totalOrphaned})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scan Result Metrics */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80">
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="text-[11px] text-zinc-400 font-medium">Total in Storage</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {result.totalR2.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Scanned R2 bucket files</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="text-[11px] text-zinc-400 font-medium">Referenced Assets</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {result.totalReferenced.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Active database records</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="text-[11px] text-zinc-400 font-medium">Orphaned Files</div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  result.totalOrphaned > 0 ? 'text-amber-400' : 'text-zinc-400'
                }`}
              >
                {result.totalOrphaned.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Unlinked & unused</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="text-[11px] text-zinc-400 font-medium">Wasted Capacity</div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  result.totalOrphanedBytes > 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {formatBytes(result.totalOrphanedBytes)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Reclaimable space</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!result && !loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mx-auto mb-3">
            <HardDrive className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-white">Scan Cloudflare R2 Storage</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Run an orphan scan across your storage bucket to detect unreferenced images, video assets, and leftover uploads.
          </p>
          <button
            type="button"
            onClick={onScan}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Scan Storage Now</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">Analyzing Storage Bucket</h4>
          <p className="text-xs text-zinc-400 mt-1">
            Listing R2 bucket contents and comparing against database references...
          </p>
        </div>
      )}

      {result && !loading && result.totalOrphaned === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-white">Storage is Clean</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            No orphaned files found in Cloudflare R2. All {result.totalR2.toLocaleString()} stored assets match active database records.
          </p>
        </div>
      )}

      {result && !loading && result.totalOrphaned > 0 && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700/60 transition cursor-pointer"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-400" />
                )}
                <span>
                  {allFilteredSelected
                    ? 'Deselect All'
                    : `Select All (${filteredOrphans.length})`}
                </span>
              </button>

              {selectedKeys.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedKeys.size})</span>
                </button>
              )}

              <span className="text-xs text-zinc-400 hidden md:inline">
                Showing {filteredOrphans.length} of {result.totalOrphaned} orphans
              </span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file name or prefix..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Grid of Orphans */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredOrphans.map((orphan) => {
              const isSelected = selectedKeys.has(orphan.key);
              const isVid = isVideo(orphan.url);
              const filename = orphan.key.split('/').pop() || orphan.key;

              return (
                <div
                  key={orphan.key}
                  className={`group relative rounded-xl overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-850/60'
                  }`}
                >
                  {/* Thumbnail / Media Container */}
                  <div className="aspect-square relative w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                    {isVid ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1.5">
                        <Video className="w-8 h-8 text-purple-400" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">
                          Video
                        </span>
                      </div>
                    ) : (
                      <img
                        src={orphan.url}
                        alt={filename}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className =
                              'w-full h-full flex items-center justify-center text-zinc-600';
                            fallback.innerHTML =
                              '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    )}

                    {/* Checkbox (top-left) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectKey(orphan.key);
                      }}
                      className="absolute top-2 left-2 p-1 rounded-md bg-black/70 backdrop-blur-sm text-white/80 hover:text-white transition cursor-pointer"
                      title={isSelected ? 'Deselect' : 'Select'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    {/* Quick Action Overlay (top-right) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={orphan.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md bg-black/70 backdrop-blur-sm text-zinc-300 hover:text-white transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(orphan);
                        }}
                        className="p-1 rounded-md bg-black/70 backdrop-blur-sm text-red-400 hover:bg-red-600 hover:text-white transition cursor-pointer"
                        title="Delete from storage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Size badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-zinc-300">
                      {formatBytes(orphan.size)}
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-2.5">
                    <div
                      className="text-xs font-medium text-zinc-200 truncate"
                      title={orphan.key}
                    >
                      {filename}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5" title={orphan.key}>
                      {orphan.key}
                    </div>
                    {orphan.lastModified && (
                      <div className="text-[10px] text-zinc-500 mt-1">
                        {formatDate(orphan.lastModified)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

