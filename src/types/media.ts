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

/* ─────────────────────────────────────────────────────────────
   Production Media Engine Pipeline Types
────────────────────────────────────────────────────────────── */

export type EngineJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'COMPLETED'
  | 'FAILURE'
  | 'ERROR'
  | 'RETRYING';

export type EngineJobType =
  | 'IMAGE_PROCESSING'
  | 'VIDEO_PROCESSING'
  | 'THUMBNAIL_PROCESSING'
  | 'RAW_CLEANUP';

export interface EngineJobLog {
  stage: string;
  message: string;
  timestamp: string;
}

export interface EngineThumbnailVariant {
  size: number | string;
  url: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  quality?: number | null;
}

export interface EnginePipelineStageOptimization {
  name: string;
  format: string;
  status: string;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  quality?: number | null;
  url?: string | null;
  logs: EngineJobLog[];
}

export interface EnginePipelineStageThumbnails {
  name: string;
  status: string;
  count: number;
  variants: EngineThumbnailVariant[];
  logs: EngineJobLog[];
}

export interface EnginePipelineStages {
  optimization: EnginePipelineStageOptimization;
  thumbnails: EnginePipelineStageThumbnails;
}

export interface EngineJob {
  id: string;
  media_id: string;
  media_filename?: string;
  media_type?: string;
  original_size?: number;
  optimized_size?: number | null;
  duration_seconds?: number | null;
  media_url?: string | null;
  media_quality?: number | null;
  blurhash?: string | null;
  dimensions?: string | null;
  thumbnails?: EngineThumbnailVariant[];
  stages?: EnginePipelineStages;
  job_type: EngineJobType | string;
  status: EngineJobStatus | string;
  attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  error_message: string | null;
  logs: EngineJobLog[];
}

export interface EngineVariant {
  url: string | null;
  content_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  quality?: number;
  duration?: number;
}

export interface EngineThumbnail {
  size: number | string;
  url: string | null;
  quality?: number;
}

export interface EngineAsset {
  id: string;
  status: string;
  media_type: 'IMAGE' | 'VIDEO' | string;
  blurhash?: string | null;
  remote_key?: string | null;
  created_at: string;
  completed_at?: string | null;
  deleted_at?: string | null;
  delete_reason?: string | null;
  original?: {
    filename: string;
    content_type: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    url?: string | null;
  } | null;
  optimized?: EngineVariant | null;
  thumbnails?: EngineThumbnail[];
  jobs?: EngineJob[];
}

export interface EngineStats {
  total_media: number;
  images_count: number;
  videos_count: number;
  saved_bytes: number;
  savings_pct: number;
  original_size: number;
  optimized_size: number;
  thumb_size: number;
  job_counts: {
    pending: number;
    processing: number;
    success: number;
    failure: number;
    retrying: number;
  };
  format_breakdown: Array<{
    original_content_type: string;
    count: number;
    total_size: number;
  }>;
  recent_jobs: EngineJob[];
}

export interface BenchmarkBatch {
  batch_id: string;
  user_handle: string;
  image_count: number;
  start_time: string | null;
  end_time: string | null;
  total_duration_seconds: number | null;
  avg_per_image: number | null;
}

export interface BenchmarkData {
  global: {
    total_assets: number;
    total_variants: number;
    original_size: number;
    optimized_size: number;
    saved_bytes: number;
    format_breakdown: Array<{
      original_content_type: string;
      count: number;
      total_size: number;
    }>;
  };
  recent_batches: BenchmarkBatch[];
}
