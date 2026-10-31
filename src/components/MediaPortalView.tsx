'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  Archive,
  Search,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  FileText,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { MediaEngineUpload } from '@/types/media';
import MediaLogsModal from './MediaLogsModal';

interface MediaPortalViewProps {
  initialUploads?: MediaEngineUpload[];
}

export default function MediaPortalView({ initialUploads = [] }: MediaPortalViewProps) {
  const [uploads, setUploads] = useState<MediaEngineUpload[]>(initialUploads);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Configuration: thumbnail option
  const [includeThumbnail, setIncludeThumbnail] = useState(true);

  // Selected files for drag-and-drop
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'expired'>('all');

  // Logs modal
  const [activeLogUpload, setActiveLogUpload] = useState<MediaEngineUpload | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Download all loading state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadingSingleZipId, setDownloadingSingleZipId] = useState<string | null>(null);

  // Polling / fetching uploads list from backend
  const refreshList = async () => {
    try {
      const res = await fetch('/api/media-engine/uploads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.uploads)) {
          setUploads((prev) => {
            // Keep any active in-flight temp items that haven't landed yet
            const pendingTemp = prev.filter((u) => u.id.startsWith('temp-'));
            const serverIds = new Set(data.uploads.map((u: MediaEngineUpload) => u.id));
            const retainedTemp = pendingTemp.filter((t) => !serverIds.has(t.id));
            return [...retainedTemp, ...data.uploads];
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch media uploads:', err);
    }
  };

  // Sync with backend every 5 seconds
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/media-engine/uploads');
        if (res.ok && mounted) {
          const data = await res.json();
          if (Array.isArray(data.uploads)) {
            setUploads((prev) => {
              const pendingTemp = prev.filter((u) => u.id.startsWith('temp-'));
              const serverIds = new Set(data.uploads.map((u: MediaEngineUpload) => u.id));
              const retainedTemp = pendingTemp.filter((t) => !serverIds.has(t.id));
              return [...retainedTemp, ...data.uploads];
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch media uploads:', err);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // TICK EVERY 1 SECOND for smooth real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setUploads((prevUploads) =>
        prevUploads.map((u) => {
          if (!u.is_live || u.remaining_seconds <= 0) return u;
          const nextSeconds = u.remaining_seconds - 1;
          if (nextSeconds <= 0) {
            return {
              ...u,
              remaining_seconds: 0,
              is_live: false,
              is_expired: true,
              tag: 'EXPIRED',
              status: 'EXPIRED',
            };
          }
          return {
            ...u,
            remaining_seconds: nextSeconds,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format file size
  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  // Format countdown mm:ss
  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Drag & drop handlers
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isImageFile = (f: File) => {
    return (
      f.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|avif|heic|heif|tiff?|bmp|gif|svg)$/i.test(f.name)
    );
  };

  // Upload handler with immediate visibility
  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter(isImageFile);
    if (validFiles.length === 0) {
      setUploadError('Please select valid image files (JPG, PNG, WebP, AVIF, TIFF, etc.)');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    // Create immediate optimistic placeholder items so the user SEES THEM AT ONCE!
    const tempItems: MediaEngineUpload[] = validFiles.map((file, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      filename: file.name,
      original_size: file.size,
      optimized_size: null,
      savings_pct: 0,
      has_thumbnail: includeThumbnail,
      thumbnail_size: null,
      status: 'PROCESSING',
      tag: 'PROCESSING',
      is_live: false,
      is_expired: false,
      remaining_seconds: 900,
      optimized_url: null,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      expires_at: null,
      purged_at: null,
      logs: [
        {
          stage: 'Uploading',
          message: `Uploading ${file.name} to PyVips media engine...`,
          timestamp: new Date().toISOString(),
        },
      ],
      error_message: null,
    }));

    setUploads((prev) => [...tempItems, ...prev]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tempId = tempItems[i].id;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('include_thumbnail', String(includeThumbnail));

      try {
        const res = await fetch('/api/media-engine/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.id) {
          // Replace optimistic placeholder with real record
          setUploads((prev) => [data, ...prev.filter((u) => u.id !== tempId && u.id !== data.id)]);
        } else {
          const errMsg = data?.error || `Upload failed for ${file.name} (Status ${res.status})`;
          setUploadError(errMsg);
          // Update placeholder to show ERROR state
          setUploads((prev) =>
            prev.map((u) =>
              u.id === tempId
                ? {
                    ...u,
                    status: 'ERROR',
                    tag: 'ERROR',
                    error_message: errMsg,
                    logs: [
                      ...u.logs,
                      {
                        stage: 'Error',
                        message: errMsg,
                        timestamp: new Date().toISOString(),
                      },
                    ],
                  }
                : u
            )
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setUploadError(`Network error while uploading ${file.name}: ${message}`);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === tempId
              ? {
                  ...u,
                  status: 'ERROR',
                  tag: 'ERROR',
                  error_message: message,
                }
              : u
          )
        );
      }

      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      refreshList();
    }, 600);
  };

  // Download single image file
  const handleDownloadSingle = (upload: MediaEngineUpload, type: 'optimized' | 'thumbnail' = 'optimized') => {
    if (upload.is_expired) return;
    const downloadUrl = `/api/media-engine/download?id=${encodeURIComponent(upload.id)}&type=${encodeURIComponent(type)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Download single upload as a ZIP with structured folder: folder -> image.avif and thumbnail.avif
  const handleDownloadSingleZip = async (upload: MediaEngineUpload) => {
    if (upload.is_expired) return;
    setDownloadingSingleZipId(upload.id);
    try {
      const res = await fetch('/api/media-engine/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [upload.id] }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate ZIP download');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = upload.filename.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_bundle.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Single ZIP download failed:', err);
      alert('Could not download ZIP. The image may have expired.');
    } finally {
      setDownloadingSingleZipId(null);
    }
  };

  // Download all live as ZIP (each photo gets its own folder: folder -> image.avif and thumbnail.avif)
  const handleDownloadAllZip = async () => {
    const liveItems = uploads.filter((u) => u.is_live);
    if (liveItems.length === 0) return;

    setIsDownloadingZip(true);
    try {
      const ids = liveItems.map((u) => u.id);
      const res = await fetch('/api/media-engine/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error('Failed to download ZIP archive');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'travingat_optimized_media.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP download failed:', err);
      alert('Failed to generate ZIP download. Images may have expired.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Filtered uploads
  const filteredUploads = useMemo(() => {
    return uploads.filter((u) => {
      const matchesSearch = u.filename.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // In Live tab, show both confirmed live and currently processing items
      if (filterTab === 'live') return u.is_live || u.status === 'PROCESSING';
      if (filterTab === 'expired') return u.is_expired;
      return true;
    });
  }, [uploads, search, filterTab]);

  const liveCount = uploads.filter((u) => u.is_live || u.status === 'PROCESSING').length;
  const expiredCount = uploads.filter((u) => u.is_expired).length;
  const hasLiveItems = uploads.some((u) => u.is_live);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-zinc-300" />
            <span>Media Engine Image Optimizer</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Upload individual images for instant PyVips AVIF optimization. Photos remain <strong>live for 15 minutes</strong> for immediate download, after which files are automatically purged from Cloudflare R2 and DB while the audit logs stay permanently.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshList}
            className="p-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error banner if upload failed */}
      {uploadError && (
        <div className="p-3.5 rounded-lg border border-red-500/40 bg-red-950/20 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[11px] underline underline-offset-2 text-red-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload & Configuration Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-5 shadow-xl">
        {/* Configuration Row: Thumbnail Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <span>Thumbnail Generation Setting</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                720p Variant
              </span>
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {includeThumbnail
                ? 'Thumbnails enabled: Optimizes main image + produces 720p thumbnail. Download options include individual image, thumbnail, or ZIP containing folder with both.'
                : 'Thumbnails disabled: Optimizes main image only. Single photo downloads without extra thumbnail variants.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={includeThumbnail}
              onChange={(e) => setIncludeThumbnail(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-zinc-950"></div>
            <span className="ml-3 text-xs font-medium text-zinc-300">
              {includeThumbnail ? 'Thumbnails Enabled' : 'Thumbnails Off'}
            </span>
          </label>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center gap-3 ${
            dragActive
              ? 'border-white bg-zinc-800/60 scale-[1.005]'
              : 'border-zinc-700/80 bg-zinc-950/40 hover:bg-zinc-950/80 hover:border-zinc-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
            <Upload className="w-6 h-6 stroke-[2]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Drop individual photos here or <span className="underline underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Supports JPEG, PNG, WebP, AVIF, TIFF, HEIC. Compressed to AVIF with PyVips.
            </p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs mt-3 space-y-1.5">
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-zinc-400 block text-center">
                Optimizing & uploading: {uploadProgress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterTab === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/80'
            }`}
          >
            All Logs ({uploads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('live')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterTab === 'live'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/80'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live ({liveCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('expired')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterTab === 'expired'
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/80'
            }`}
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            Expired ({expiredCount})
          </button>
        </div>

        {/* Search & Global Download All Action */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by filename..."
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Global Download All (ZIP) button */}
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={!hasLiveItems || isDownloadingZip}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors shadow ${
              hasLiveItems && !isDownloadingZip
                ? 'bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
            }`}
            title="Download all live photos structured in folders inside a single ZIP"
          >
            {isDownloadingZip ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Packing ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Download All (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Uploads List Table / Cards */}
      {filteredUploads.length === 0 ? (
        <div className="py-20 text-center border border-zinc-800/80 rounded-xl bg-zinc-950/40 text-zinc-500 text-xs">
          <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p>No images matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUploads.map((upload) => (
            <div
              key={upload.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                upload.is_live
                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-lg'
                  : upload.status === 'PROCESSING'
                  ? 'bg-zinc-900/80 border-blue-900/50 shadow-md'
                  : upload.status === 'ERROR'
                  ? 'bg-zinc-950/80 border-red-900/60'
                  : upload.is_expired
                  ? 'bg-zinc-950/70 border-zinc-850 opacity-80'
                  : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              {/* Left Column: Image preview & Meta */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                  {upload.is_live && upload.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={upload.thumbnail_url}
                      alt={upload.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : upload.is_live && upload.optimized_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={upload.optimized_url}
                      alt={upload.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : upload.status === 'PROCESSING' ? (
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : upload.status === 'ERROR' ? (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white truncate max-w-sm" title={upload.filename}>
                      {upload.filename}
                    </h3>

                    {/* LIVE (with per-second countdown) / EXPIRED / PROCESSING / ERROR Tag */}
                    {upload.is_live ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE (⏱ {formatCountdown(upload.remaining_seconds)})
                      </span>
                    ) : upload.status === 'PROCESSING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        PROCESSING
                      </span>
                    ) : upload.status === 'ERROR' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-red-950 text-red-400 border border-red-800">
                        FAILED
                      </span>
                    ) : upload.is_expired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <Trash2 className="w-3 h-3 text-red-400" />
                        EXPIRED
                      </span>
                    ) : null}

                    {upload.has_thumbnail && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                        +720p Thumb
                      </span>
                    )}
                  </div>

                  {/* Size and Savings Info */}
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>
                      Original: <strong className="font-mono text-zinc-300">{formatBytes(upload.original_size)}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      Optimized:{' '}
                      <strong className="font-mono text-white">
                        {upload.optimized_size ? formatBytes(upload.optimized_size) : upload.status === 'PROCESSING' ? 'Encoding...' : '—'}
                      </strong>
                    </span>
                    {upload.savings_pct > 0 && (
                      <span className="text-emerald-400 font-mono font-medium">
                        (-{upload.savings_pct}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Action Buttons ON THE SAME LINE */}
              <div className="flex items-center gap-2 flex-wrap shrink-0 self-end md:self-center">
                {/* View Logs Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveLogUpload(upload);
                    setIsLogsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Logs</span>
                </button>

                {/* Download Actions (On the same line per image) */}
                {upload.is_live ? (
                  <>
                    {/* 1. Download single image */}
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(upload, 'optimized')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shadow"
                      title="Download single optimized image (image.avif)"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Download</span>
                    </button>

                    {/* 2. Download thumbnail if requested */}
                    {upload.has_thumbnail && (
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(upload, 'thumbnail')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
                        title="Download 720p thumbnail (thumbnail.avif)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Thumb</span>
                      </button>
                    )}

                    {/* 3. Download All (ZIP) for this image: packages folder -> image.avif and thumbnail.avif */}
                    <button
                      type="button"
                      disabled={downloadingSingleZipId === upload.id}
                      onClick={() => handleDownloadSingleZip(upload)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-md transition-colors shadow-sm disabled:opacity-50"
                      title="Download ZIP containing folder with image.avif and thumbnail.avif"
                    >
                      {downloadingSingleZipId === upload.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Archive className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span>Download All (ZIP)</span>
                    </button>
                  </>
                ) : upload.status === 'PROCESSING' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-mono px-3 py-1.5 rounded bg-blue-950/40 border border-blue-900/60">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Optimizing...
                  </span>
                ) : upload.status === 'ERROR' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-red-400 font-mono px-3 py-1.5 rounded bg-red-950/40 border border-red-900/60">
                    Processing Error
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 font-mono px-3 py-1.5 rounded bg-zinc-950/60 border border-zinc-850"
                    title="Deleted from Cloudflare R2 after 15 minutes of optimization"
                  >
                    Purged from R2 & DB
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Modal */}
      <MediaLogsModal
        upload={activeLogUpload}
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
}
