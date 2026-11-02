'use client';

import React from 'react';
import { EngineAsset } from '@/types/media';
import { formatBytes, formatDate, get720pThumbnailUrl } from '@/lib/media-utils';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Video,
  ShieldAlert,
} from 'lucide-react';

interface MediaRecycleBinTabProps {
  items: EngineAsset[];
  loading: boolean;
  totalCount: number;
  onRestore: (assetId: string) => Promise<void>;
  onHardDelete: (assetId: string) => Promise<void>;
  onEmptyRecycleBin: () => Promise<void>;
  restoringId: string | null;
  deletingId: string | null;
  isEmptying: boolean;
}

export default function MediaRecycleBinTab({
  items,
  loading,
  totalCount,
  onRestore,
  onHardDelete,
  onEmptyRecycleBin,
  restoringId,
  deletingId,
  isEmptying,
}: MediaRecycleBinTabProps) {
  return (
    <div className="space-y-4">
      {/* Recycle Bin Header / Notice */}
      <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Recycle Bin ({totalCount} items)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Soft-deleted media assets. Restoring moves them back to active inventory; permanent deletion removes raw and optimized files from storage forever.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onEmptyRecycleBin}
            disabled={isEmptying}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isEmptying ? 'animate-spin' : ''}`} />
            <span>{isEmptying ? 'Emptying...' : 'Empty Recycle Bin'}</span>
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Deleted At</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                      <span>Loading recycle bin...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trash2 className="w-8 h-8 text-zinc-600" />
                      <span className="text-zinc-300 font-medium">Recycle bin is empty</span>
                      <span className="text-xs text-zinc-500">
                        Deleted media assets will appear here.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isRestoring = restoringId === item.id;
                  const isHardDeleting = deletingId === item.id;
                  const originalSize = item.original?.size || 0;
                  const previewUrl = get720pThumbnailUrl(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-850/60 transition-colors"
                    >
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 overflow-hidden flex items-center justify-center shrink-0 opacity-70">
                            {previewUrl ? (
                              item.media_type === 'VIDEO' ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : (
                                <img
                                  src={previewUrl}
                                  alt={item.original?.filename || 'media'}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )
                            ) : (
                              <ImageIcon className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-300 truncate">
                              {item.original?.filename || 'Unnamed Asset'}
                            </div>
                            <div className="font-mono text-[10px] text-zinc-500 truncate">
                              ID: {item.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {item.media_type}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {formatBytes(originalSize)}
                      </td>

                      <td className="py-3 px-4 text-zinc-400">
                        {formatDate(item.deleted_at)}
                      </td>

                      <td className="py-3 px-4 text-zinc-500 truncate max-w-[180px]">
                        {item.delete_reason || 'Deleted by admin'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onRestore(item.id)}
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-zinc-700 hover:border-emerald-500/40 rounded-md transition-colors disabled:opacity-50 cursor-pointer text-xs font-medium"
                          >
                            <RotateCcw
                              className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`}
                            />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onHardDelete(item.id)}
                            disabled={isHardDeleting}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-md transition-colors disabled:opacity-50 cursor-pointer text-xs font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Purge</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

