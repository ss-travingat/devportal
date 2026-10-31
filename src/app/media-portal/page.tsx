'use client';

import React, { useState } from 'react';
import { MediaAsset } from '@/types/media';
import { loadMediaAssets, saveMediaAssets } from '@/lib/media-storage';
import MediaPortalView from '@/components/MediaPortalView';
import MediaUploadModal from '@/components/MediaUploadModal';

export default function MediaPortalPage() {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => loadMediaAssets());
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);

  const handleUploadMediaSuccess = (newAssets: MediaAsset[]) => {
    const updated = [...newAssets, ...mediaAssets];
    setMediaAssets(updated);
    saveMediaAssets(updated);
  };

  const handleDeleteMediaAsset = (id: string) => {
    const updated = mediaAssets.filter((a) => a.id !== id);
    setMediaAssets(updated);
    saveMediaAssets(updated);
  };

  return (
    <>
      <MediaPortalView
        assets={mediaAssets}
        onOpenUpload={() => setIsMediaUploadOpen(true)}
        onDeleteAsset={handleDeleteMediaAsset}
      />

      <MediaUploadModal
        isOpen={isMediaUploadOpen}
        onClose={() => setIsMediaUploadOpen(false)}
        onUploadSuccess={handleUploadMediaSuccess}
      />
    </>
  );
}

