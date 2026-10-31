'use client';

import React, { useState } from 'react';
import { X, FileText, Trash2, AlertTriangle, Copy, Check, ExternalLink, HardDrive, ShieldCheck } from 'lucide-react';
import { MediaEngineUpload } from '@/types/media';

interface MediaLogsModalProps {
  upload: MediaEngineUpload | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaLogsModal({ upload, isOpen, onClose }: MediaLogsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !upload) return null;

  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const isLive = upload.is_live;
  const isFailed = upload.status === 'ERROR' || !!upload.error_message;
  const isPermanent = upload.is_permanent ?? (upload.expires_at === null);
  const assetUrl = upload.asset_url || upload.optimized_url;

  const handleCopy = () => {
    if (!assetUrl) return;
    navigator.clipboard.writeText(assetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <div className={`p-2 border rounded-lg ${isFailed ? 'bg-red-950/60 border-red-900/80 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
              {isFailed ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white truncate max-w-md">
                  {upload.filename}
                </h2>
                {isPermanent && isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    PERMANENT
                  </span>
                ) : isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                ) : upload.is_expired ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    <Trash2 className="w-3 h-3 text-red-400" />
                    EXPIRED & PURGED
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-red-950 text-red-400 border border-red-800">
                    FAILED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                    {upload.status}
                  </span>
                )}

                {upload.is_compressed ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                    AVIF COMPRESSED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    ORIGINAL FORMAT
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0 text-xs">
          {/* Failure Alert Banner */}
          {isFailed && (
            <div className="p-3.5 rounded-lg border border-red-900/60 bg-red-950/30 text-red-300 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Processing Failed</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-red-300 font-mono">
                  {upload.error_message || 'The upload or processing step could not be completed.'}
                </p>
              </div>
            </div>
          )}

          {/* Public Asset URL Box */}
          {assetUrl && (
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                  Public Asset URL (Permanent Cloudflare R2)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Bucket: {upload.bucket_name || 'travingat-assets'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={assetUrl}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded text-zinc-200 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 rounded transition-colors shrink-0"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Original Size</span>
              <span className="text-sm font-semibold text-zinc-200 font-mono mt-1 block">
                {formatBytes(upload.original_size)}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Stored Size</span>
              <span className="text-sm font-semibold text-zinc-200 font-mono mt-1 block">
                {upload.optimized_size ? formatBytes(upload.optimized_size) : formatBytes(upload.original_size)}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Compression</span>
              <span className="text-sm font-semibold text-zinc-200 font-mono mt-1 block">
                {upload.is_compressed ? 'AVIF (PyVips)' : 'Off (Original)'}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Space Saved</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono mt-1 block">
                {upload.savings_pct > 0 ? `-${upload.savings_pct}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Permanent Storage Notice */}
          <div className="p-3.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 text-xs flex items-start gap-3 text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-semibold text-zinc-200">
                Permanent Asset Storage Active
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed text-zinc-400">
                This asset is permanently hosted in the Cloudflare R2 bucket <strong>{upload.bucket_name || 'travingat-assets'}</strong> in the <strong>assets/</strong> directory. It has no auto-expiration or scheduled purge.
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
                {upload.logs.map((log, idx) => {
                  const isErrStage = log.stage.toLowerCase().includes('error') || log.stage.toLowerCase().includes('failed');
                  return (
                    <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isErrStage ? 'bg-red-400' : 'bg-zinc-400'}`} />
                        <div>
                          <span className={`font-semibold mr-2 ${isErrStage ? 'text-red-300' : 'text-zinc-200'}`}>
                            {log.stage}:
                          </span>
                          <span className={isErrStage ? 'text-red-300/90' : 'text-zinc-400'}>
                            {log.message}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-900 shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            {upload.completed_at ? `Completed: ${new Date(upload.completed_at).toLocaleTimeString()}` : isFailed ? 'Failed' : 'In progress'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
