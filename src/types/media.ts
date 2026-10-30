export type MediaType = 'image' | 'video' | 'document';

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  size: string;
  dimensions?: string;
  url: string;
  bucket: string;
  category: string;
  uploadedAt: string;
  format: string;
}

