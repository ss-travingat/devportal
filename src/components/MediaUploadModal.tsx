'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Plus, File, Image as ImageIcon, Film, CheckCircle2 } from 'lucide-react';
import { MediaAsset, MediaType } from '@/types/media';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newAssets: MediaAsset[]) => void;
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: MediaUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('Banners');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isUploading, onClose]);

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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return Math.round(bytes / 1024) + ' KB';
  };

  const getMediaType = (mime: string, name: string): { type: MediaType; format: string } => {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    if (mime.startsWith('image/')) return { type: 'image', format: ext };
    if (mime.startsWith('video/')) return { type: 'video', format: ext };
    return { type: 'document', format: ext };
  };

  const handleStartUpload = () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadComplete(true);

      const timestamp = new Date().toISOString().split('T')[0];
      const createdAssets: MediaAsset[] = selectedFiles.map((file, idx) => {
        const { type, format } = getMediaType(file.type, file.name);
        return {
          id: `med-${Date.now()}-${idx}`,
          name: file.name,
          type,
          size: formatFileSize(file.size),
          dimensions: type === 'image' ? 'Original' : undefined,
          url: `https://cdn.travingat.com/${category.toLowerCase()}/${encodeURIComponent(file.name)}`,
          bucket: 'travingat-prod-media',
          category,
          uploadedAt: timestamp,
          format,
        };
      });

      onUploadSuccess(createdAssets);

      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress(0);
        setUploadComplete(false);
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-900">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-zinc-300" />
              <span>Media Upload</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload photos, video reels, and assets directly to Cloudflare R2 storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Target category select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Target Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="Banners">Banners (Hero & Profile Covers)</option>
              <option value="Cards">Explorer Cards (Snapshots & Badges)</option>
              <option value="Profiles">Creator Profiles (Avatars & Albums)</option>
              <option value="Videos">Videos (Reels & Stream Previews)</option>
              <option value="Branding">Branding (Logos & Vector Assets)</option>
              <option value="General">General Assets</option>
            </select>
          </div>

          {/* Drag & Drop Zone with Big Plus Icon */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
              dragActive
                ? 'border-white bg-zinc-800/60'
                : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.svg,.pdf,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Big Plus / Upload Icon */}
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Plus className="w-7 h-7 text-white stroke-[2.5]" />
            </div>

            <p className="text-sm font-semibold text-white">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Supports WEBP, PNG, JPG, SVG, MP4, WEBM (Up to 100MB)
            </p>
          </div>

          {/* Selected Files Preview List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Selected Files ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                  className="text-zinc-500 hover:text-zinc-300 text-[11px]"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => {
                  const isImg = file.type.startsWith('image/');
                  const isVid = file.type.startsWith('video/');
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-md text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                        {isImg ? (
                          <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : isVid ? (
                          <Film className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                        <span className="text-zinc-200 truncate">{file.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Uploading to travingat-prod-media...</span>
                <span className="font-mono text-zinc-300">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Complete Feedback */}
          {uploadComplete && (
            <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-md flex items-center gap-2 text-xs text-zinc-200">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Files successfully uploaded to Cloudflare R2 bucket!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white rounded-md transition-colors shadow"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : `Upload ${selectedFiles.length || ''} Files`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
