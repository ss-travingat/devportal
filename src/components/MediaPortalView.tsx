'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  Archive,
  Search,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Sliders,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Link as LinkIcon,
  ShieldCheck,
  Trash2,
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

  // Configuration: compression toggle (OFF by default)
  const [compressImage, setCompressImage] = useState(false);

  // Selected files for drag-and-drop
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'original' | 'compressed'>('all');

  // Logs modal
  const [activeLogUpload, setActiveLogUpload] = useState<MediaEngineUpload | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Download all loading state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Copy asset URL with visual feedback
  const copyUrlToClipboard = (id: string, url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Polling / fetching uploads list from backend
  const refreshList = async () => {
    try {
      const res = await fetch('/api/media-engine/uploads');
      if (res.ok) {
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

  // Adaptive sync with backend:
  // Poll every 3s while items are PROCESSING; 60s when idle
  const hasProcessing = uploads.some(
    (u) => u.status === 'PROCESSING' || u.id.startsWith('temp-')
  );

  useEffect(() => {
    let mounted = true;
    let timer: NodeJS.Timeout;

    const tick = async () => {
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
        if (mounted) console.error('Failed to fetch media uploads:', err);
      } finally {
        if (mounted) {
          timer = setTimeout(tick, hasProcessing ? 3000 : 60000);
        }
      }
    };

    timer = setTimeout(tick, hasProcessing ? 2000 : 60000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [hasProcessing]);

  // Format file size
  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
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

    // Create immediate optimistic placeholder items
    const tempItems: MediaEngineUpload[] = validFiles.map((file, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      filename: file.name,
      original_size: file.size,
      optimized_size: compressImage ? null : file.size,
      savings_pct: 0,
      has_thumbnail: false,
      thumbnail_size: null,
      is_compressed: compressImage,
      bucket_name: 'travingat-assets',
      asset_url: null,
      status: 'PROCESSING',
      tag: 'PROCESSING',
      is_live: true,
      is_permanent: true,
      is_expired: false,
      remaining_seconds: 0,
      optimized_url: null,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      expires_at: null,
      purged_at: null,
      logs: [
        {
          stage: 'Uploading',
          message: `Streaming ${file.name} directly to Cloudflare R2 (travingat-assets)...`,
          timestamp: new Date().toISOString(),
        },
      ],
      error_message: null,
    }));

    setUploads((prev) => [...tempItems, ...prev]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tempId = tempItems[i].id;

      // Check max size limit (25 MB)
      if (file.size > 25 * 1024 * 1024) {
        const errMsg = `${file.name} is ${formatBytes(file.size)}, exceeding the 25 MB maximum upload limit.`;
        setUploadError(errMsg);
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
                    { stage: 'Error', message: errMsg, timestamp: new Date().toISOString() },
                  ],
                }
              : u
          )
        );
        continue;
      }

      try {
        // 1. Request direct Cloudflare R2 presigned URL from backend
        const presignRes = await fetch('/api/media-engine/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type || 'image/jpeg',
            size: file.size,
            compress: compressImage,
          }),
        });

        const presignData = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok || !presignData.presigned_url) {
          throw new Error(presignData?.error || `Failed to get R2 presigned URL (Status ${presignRes.status})`);
        }

        const { upload_id, presigned_url, content_type: uploadContentType, upload: initialUpload } = presignData;

        // Replace optimistic placeholder with official server record
        if (initialUpload) {
          setUploads((prev) => [
            {
              ...initialUpload,
              logs: [
                ...initialUpload.logs,
                { stage: 'Uploading', message: 'Streaming directly to Cloudflare R2...', timestamp: new Date().toISOString() },
              ],
            },
            ...prev.filter((u) => u.id !== tempId && u.id !== upload_id),
          ]);
        }

        // 2. Stream raw file DIRECTLY to Cloudflare R2 via HTTP PUT
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presigned_url, true);
          xhr.setRequestHeader('Content-Type', uploadContentType || file.type || 'image/jpeg');

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const overallProgress = Math.round(((i + (evt.loaded / evt.total)) / validFiles.length) * 100);
              setUploadProgress(overallProgress);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Cloudflare R2 storage rejected upload (Status ${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error uploading directly to Cloudflare R2'));
          xhr.send(file);
        });

        // 3. Finalize upload or trigger PyVips AVIF optimization on backend
        const processRes = await fetch('/api/media-engine/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upload_id }),
        });

        const processData = await processRes.json().catch(() => ({}));
        if (processRes.ok && processData.id) {
          setUploads((prev) => [processData, ...prev.filter((u) => u.id !== processData.id)]);
        } else {
          throw new Error(processData?.error || 'Failed to finalize asset upload');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setUploadError(`Failed to upload ${file.name}: ${message}`);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === tempId || (u.filename === file.name && u.status === 'PROCESSING')
              ? {
                  ...u,
                  status: 'ERROR',
                  tag: 'ERROR',
                  error_message: message,
                  logs: [
                    ...u.logs,
                    {
                      stage: 'Error',
                      message: message,
                      timestamp: new Date().toISOString(),
                    },
                  ],
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
  const handleDownloadSingle = (upload: MediaEngineUpload) => {
    if (upload.is_expired) return;
    const downloadUrl = `/api/media-engine/download?id=${encodeURIComponent(upload.id)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Download all ready items as ZIP
  const handleDownloadAllZip = async () => {
    const readyItems = uploads.filter((u) => u.status === 'READY');
    if (readyItems.length === 0) return;

    setIsDownloadingZip(true);
    try {
      const ids = readyItems.map((u) => u.id);
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
      a.download = 'travingat_assets.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP download failed:', err);
      alert('Failed to generate ZIP download.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Delete single upload log record
  const handleDeleteSingle = async (upload: MediaEngineUpload) => {
    setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    try {
      await fetch(`/api/media-engine/uploads/${encodeURIComponent(upload.id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete upload log:', err);
    }
  };

  // Bulk clear previous expired or error logs
  const [isClearing, setIsClearing] = useState(false);
  const handleClearPreviousLogs = async () => {
    setIsClearing(true);
    setUploads((prev) => prev.filter((u) => u.status === 'READY' && !u.is_expired));
    try {
      await fetch('/api/media-engine/clear-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'all_previous' }),
      });
      await refreshList();
    } catch (err) {
      console.error('Failed to clear previous logs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Filtered uploads: exclude legacy expired logs from active list
  const filteredUploads = useMemo(() => {
    return uploads.filter((u) => {
      if (u.is_expired) return false;
      const matchesSearch = u.filename.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filterTab === 'original') return !u.is_compressed;
      if (filterTab === 'compressed') return u.is_compressed;
      return true;
    });
  }, [uploads, search, filterTab]);

  const activeUploads = useMemo(() => uploads.filter((u) => !u.is_expired), [uploads]);
  const originalCount = activeUploads.filter((u) => !u.is_compressed).length;
  const compressedCount = activeUploads.filter((u) => u.is_compressed).length;
  const hasReadyItems = activeUploads.some((u) => u.status === 'READY');
  const hasPreviousLogs = uploads.some((u) => u.is_expired || u.status === 'ERROR');

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
            Upload images directly to permanent Cloudflare R2 storage (<strong>travingat-assets</strong> bucket, <strong>assets/</strong> folder). Instant public CDN URLs are immediately ready to use anywhere. Optional PyVips AVIF compression available.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshList}
            className="p-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Refresh asset list"
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
        {/* Configuration Row: Compression Toggle (OFF by default) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <span>Image Compression (PyVips AVIF)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Off by default
              </span>
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {compressImage
                ? 'Compression enabled: Converts images to high-efficiency AVIF via PyVips (~80-95% smaller), saved permanently to travingat-assets/assets/.'
                : 'Compression disabled: Uploads images in original format directly to travingat-assets/assets/. Instant completion, zero loss.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={compressImage}
              onChange={(e) => setCompressImage(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-zinc-950"></div>
            <span className="ml-3 text-xs font-medium text-zinc-300">
              {compressImage ? 'Compress to AVIF (ON)' : 'Compression (OFF)'}
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
              Drop photos here or <span className="underline underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Supports JPEG, PNG, WebP, AVIF, TIFF, HEIC. Permanent Cloudflare R2 asset storage.
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
                Uploading to R2: {uploadProgress}%
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
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/80'
            }`}
          >
            All Assets ({uploads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('original')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterTab === 'original'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/80'
            }`}
          >
            Original ({originalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('compressed')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterTab === 'compressed'
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/80'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            AVIF Compressed ({compressedCount})
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

          {/* Clear Previous Logs button if there are expired or failed items */}
          {hasPreviousLogs && (
            <button
              type="button"
              onClick={handleClearPreviousLogs}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer shrink-0"
              title="Remove all previous expired and failed logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>{isClearing ? 'Clearing...' : 'Clear Previous Logs'}</span>
            </button>
          )}

          {/* Global Download All (ZIP) button */}
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={!hasReadyItems || isDownloadingZip}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors shadow ${
              hasReadyItems && !isDownloadingZip
                ? 'bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
            }`}
            title="Download ready assets in a ZIP archive"
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
          <p>No assets matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUploads.map((upload) => {
            const assetUrl = upload.asset_url || upload.optimized_url;

            return (
              <div
                key={upload.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  upload.status === 'READY'
                    ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-lg'
                    : upload.status === 'PROCESSING'
                    ? 'bg-zinc-900/80 border-blue-900/50 shadow-md'
                    : upload.status === 'ERROR'
                    ? 'bg-zinc-950/80 border-red-900/60'
                    : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                {/* Left Column: Image preview & Details */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                    {assetUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetUrl}
                        alt={upload.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : upload.status === 'PROCESSING' ? (
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : upload.status === 'ERROR' ? (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate max-w-sm" title={upload.filename}>
                        {upload.filename}
                      </h3>

                      {/* Status Badges */}
                      {upload.status === 'READY' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          PERMANENT
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
                      ) : null}

                      {upload.is_compressed ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/70">
                          AVIF COMPRESSED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          ORIGINAL
                        </span>
                      )}
                    </div>

                    {/* Size and Savings Info */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                      {upload.is_compressed ? (
                        <>
                          <span>
                            Original: <strong className="font-mono text-zinc-300">{formatBytes(upload.original_size)}</strong>
                          </span>
                          <span>→</span>
                          <span>
                            Optimized:{' '}
                            <strong className="font-mono text-white">
                              {upload.optimized_size ? formatBytes(upload.optimized_size) : 'Encoding...'}
                            </strong>
                          </span>
                          {upload.savings_pct > 0 && (
                            <span className="text-emerald-400 font-mono font-medium">
                              (-{upload.savings_pct}%)
                            </span>
                          )}
                        </>
                      ) : (
                        <span>
                          File Size: <strong className="font-mono text-zinc-200">{formatBytes(upload.original_size)}</strong> (Lossless Original)
                        </span>
                      )}
                    </div>

                    {/* Permanent Asset URL Pill with One-Click Copy */}
                    {assetUrl && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[11px] font-mono text-zinc-300 min-w-0 max-w-xs sm:max-w-md lg:max-w-lg overflow-hidden">
                          <LinkIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate select-all" title={assetUrl}>
                            {assetUrl}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyUrlToClipboard(upload.id, assetUrl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 rounded-md transition-colors shrink-0 cursor-pointer"
                          title="Copy Public Asset URL"
                        >
                          {copiedId === upload.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>

                        <a
                          href={assetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors shrink-0"
                          title="Open asset URL in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0 self-end md:self-center">
                  {/* View Logs Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLogUpload(upload);
                      setIsLogsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Logs</span>
                  </button>

                  {/* Delete Log Entry Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSingle(upload)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 border border-zinc-700 rounded-md transition-colors cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Download Action */}
                  {upload.status === 'READY' ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(upload)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shadow cursor-pointer"
                      title="Download asset"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Download</span>
                    </button>
                  ) : upload.status === 'PROCESSING' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-mono px-3 py-1.5 rounded bg-blue-950/40 border border-blue-900/60">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Optimizing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400 font-mono px-3 py-1.5 rounded bg-red-950/40 border border-red-900/60">
                      Processing Error
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
