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

export interface MediaEngineUploadLog {
  stage: string;
  message: string;
  timestamp: string;
}

export interface MediaEngineUpload {
  id: string;
  filename: string;
  original_size: number;
  optimized_size: number | null;
  savings_pct: number;
  has_thumbnail: boolean;
  thumbnail_size: number | null;
  is_compressed: boolean;
  bucket_name: string;
  asset_url: string | null;
  status: 'PROCESSING' | 'READY' | 'EXPIRED' | 'ERROR';
  tag: 'PERMANENT' | 'LIVE' | 'EXPIRED' | 'PROCESSING' | 'ERROR';
  is_live: boolean;
  is_permanent?: boolean;
  is_expired: boolean;
  remaining_seconds: number;
  optimized_url: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  purged_at: string | null;
  logs: MediaEngineUploadLog[];
  error_message: string | null;
}
