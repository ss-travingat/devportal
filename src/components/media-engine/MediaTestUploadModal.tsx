'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { formatBytes } from '@/lib/media-utils';

interface MediaTestUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (assetId: string) => void;
}

export default function MediaTestUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: MediaTestUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [generateThumb720, setGenerateThumb720] = useState(true);
  const [generateThumb144, setGenerateThumb144] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const thumbnails: number[] = [];
      if (generateThumb720) thumbnails.push(720);
      if (generateThumb144) thumbnails.push(144);
      formData.append('thumbnails', JSON.stringify(thumbnails));

      const res = await fetch('/api/media-engine/assets', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload asset to media engine');
      }

      const assetId = data.id;
      onUploadSuccess(assetId);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Media Engine Test Pipeline</h2>
              <p className="text-xs text-zinc-400">
                Upload raw media to observe transcoding & thumbnail generation live.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/40'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-semibold text-sm text-white truncate max-w-xs mx-auto">
                  {file.name}
                </div>
                <div className="text-xs font-mono text-zinc-400">{formatBytes(file.size)}</div>
                <p className="text-[11px] text-zinc-500">Click or drop to replace file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-white">
                  Click to select or drag & drop media
                </div>
                <p className="text-xs text-zinc-400">Supports JPEG, PNG, WebP, AVIF, MP4, MOV</p>
              </div>
            )}
          </div>

          {/* Pipeline Options */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Pipeline Target Options
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateThumb720}
                  onChange={(e) => setGenerateThumb720(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Generate 720p Masonry Thumbnail (AVIF / WebP)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateThumb144}
                  onChange={(e) => setGenerateThumb144(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Generate 144p Blurred Preview & Blurhash String</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Queueing to Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Pipeline Test</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

