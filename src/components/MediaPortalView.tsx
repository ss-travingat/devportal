'use client';

import React, { useState, useMemo } from 'react';
import {
  Image,
  Film,
  File,
  Copy,
  Check,
  Trash2,
  Search,
  Plus,
  Cloud,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { MediaAsset } from '@/types/media';

interface MediaPortalViewProps {
  assets: MediaAsset[];
  onOpenUpload: () => void;
  onDeleteAsset: (id: string) => void;
}

export default function MediaPortalView({
  assets,
  onOpenUpload,
  onDeleteAsset,
}: MediaPortalViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Banners', 'Cards', 'Profiles', 'Videos', 'Branding'];

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.category.toLowerCase().includes(search.toLowerCase()) ||
        asset.format.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'All' || asset.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [assets, search, selectedCategory]);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const imageCount = assets.filter((a) => a.type === 'image').length;
  const videoCount = assets.filter((a) => a.type === 'video').length;

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Media Portal
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cloudflare R2 Object Storage buckets, creator media assets, and CDN delivery networks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shadow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Total Assets</span>
            <HardDrive className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{assets.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {imageCount} Images • {videoCount} Videos
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>R2 Bucket</span>
            <Cloud className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-sm font-semibold font-mono text-zinc-200 truncate">
            travingat-prod-media
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">S3-Compatible Object Store</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>CDN Endpoint</span>
            <ExternalLink className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-sm font-semibold font-mono text-zinc-200 truncate">
            cdn.travingat.com
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Edge Cached (TTL 1y)</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Media Engine</span>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
          <div className="text-sm font-semibold font-mono text-zinc-200">
            Celery / Sharp
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Auto-WebP & Thumbnails</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-zinc-950 font-semibold shadow'
                  : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media files..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Media Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs border border-zinc-800 rounded-xl bg-zinc-900/40">
          No media files found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const isImage = asset.type === 'image';
            const isVideo = asset.type === 'video';

            return (
              <div
                key={asset.id}
                className="group p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Top file preview badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md">
                      {isImage ? (
                        <Image className="w-4 h-4 text-zinc-200" />
                      ) : isVideo ? (
                        <Film className="w-4 h-4 text-zinc-200" />
                      ) : (
                        <File className="w-4 h-4 text-zinc-200" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                        {asset.format}
                      </span>
                    </div>
                  </div>

                  {/* Name & Details */}
                  <h3 className="text-xs font-semibold text-white truncate mb-1" title={asset.name}>
                    {asset.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                    <span>{asset.size}</span>
                    {asset.dimensions && (
                      <>
                        <span>•</span>
                        <span>{asset.dimensions}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {asset.category} • Uploaded {asset.uploadedAt}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(asset.id, asset.url)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded transition-colors"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        <span>Copied CDN</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

