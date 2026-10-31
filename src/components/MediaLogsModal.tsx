'use client';

import React from 'react';
import { X, Clock, FileText, Trash2 } from 'lucide-react';
import { MediaEngineUpload } from '@/types/media';

interface MediaLogsModalProps {
  upload: MediaEngineUpload | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaLogsModal({ upload, isOpen, onClose }: MediaLogsModalProps) {
  if (!isOpen || !upload) return null;

  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const isLive = upload.is_live;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg">
              <FileText className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate max-w-md">
                  {upload.filename}
                </h2>
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                ) : upload.is_expired ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    <Trash2 className="w-3 h-3 text-red-400" />
                    EXPIRED & PURGED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                    {upload.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">ID: {upload.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 text-xs">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Original Size</span>
              <span className="text-sm font-semibold text-zinc-200 font-mono mt-1 block">
                {formatBytes(upload.original_size)}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Optimized (AVIF)</span>
              <span className="text-sm font-semibold text-zinc-200 font-mono mt-1 block">
                {upload.optimized_size ? formatBytes(upload.optimized_size) : '—'}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Space Saved</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono mt-1 block">
                {upload.savings_pct > 0 ? `-${upload.savings_pct}%` : '—'}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">720p Thumbnail</span>
              <span className="text-sm font-semibold text-zinc-200 font-mono mt-1 block">
                {upload.has_thumbnail ? 'Included' : 'None'}
              </span>
            </div>
          </div>

          {/* Retention Notice */}
          <div className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
            isLive 
              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
          }`}>
            <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${isLive ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <div>
              <p className="font-medium text-zinc-200">
                {isLive ? '15-Minute Live Window Active' : 'Retention Period Expired'}
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed text-zinc-400">
                {isLive ? (
                  <>
                    This photo is currently stored in Cloudflare R2 and can be downloaded immediately. 
                    It will be permanently deleted from R2 storage and the database once the 15-minute optimization window finishes.
                  </>
                ) : (
                  <>
                    The 15-minute optimization window has finished. The image files and database records have been permanently purged from Cloudflare R2. This audit log remains preserved.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Audit Logs Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Execution Logs & Lifecycle History
            </h3>

            {(!upload.logs || upload.logs.length === 0) ? (
              <div className="py-6 text-center text-zinc-500 border border-zinc-800/60 rounded-lg">
                No logs recorded yet.
              </div>
            ) : (
              <div className="space-y-2 border border-zinc-800/80 rounded-lg p-3 bg-zinc-950/80 divide-y divide-zinc-900">
                {upload.logs.map((log, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-zinc-200 mr-2">{log.stage}:</span>
                        <span className="text-zinc-400">{log.message}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-900 shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            {upload.completed_at ? `Completed: ${new Date(upload.completed_at).toLocaleTimeString()}` : 'In progress'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
