import { EngineAsset } from '@/types/media';

export function formatBytes(bytes: number | null | undefined, decimals = 2): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) {
    return '0 B';
  }
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const val = parseFloat((absBytes / Math.pow(k, i)).toFixed(dm));
  return `${isNegative ? '-' : ''}${val} ${sizes[i]}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '—';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.round(seconds % 60);
  return `${mins}m ${remSecs}s`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function getFileExtension(filename: string | null | undefined): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Returns the 720p thumbnail URL for a given media asset.
 * For images, specifically resolves the 720p thumbnail variant.
 */
export function get720pThumbnailUrl(asset: EngineAsset | null | undefined): string | null {
  if (!asset) return null;

  if (asset.media_type === 'VIDEO') {
    const videoThumb = asset.thumbnails?.find((t) => {
      if (!t) return false;
      const s = String(t.size ?? '').toLowerCase().trim();
      return (
        s === '720' ||
        s === '720p' ||
        (typeof t.url === 'string' && (t.url.includes('/720.') || t.url.includes('_720.') || t.url.includes('720')))
      );
    });
    return videoThumb?.url || asset.optimized?.url || asset.original?.url || null;
  }

  if (!asset.thumbnails || !Array.isArray(asset.thumbnails) || asset.thumbnails.length === 0) {
    return null;
  }

  // 1. Direct match for 720 / 720p
  const thumb720 = asset.thumbnails.find((t) => {
    if (!t) return false;
    const s = String(t.size ?? '').toLowerCase().trim();
    if (s === '720' || s === '720p') return true;
    if (typeof t.url === 'string' && (t.url.includes('/720.') || t.url.includes('_720.') || t.url.includes('720'))) {
      return true;
    }
    return false;
  });

  if (thumb720?.url) {
    return thumb720.url;
  }

  // 2. If single thumbnail exists in engine and matches 720 or is unlabelled (Media Engine generates 720)
  if (asset.thumbnails.length === 1 && asset.thumbnails[0]?.url) {
    const s = String(asset.thumbnails[0].size ?? '').toLowerCase().trim();
    if (!s || s === '720' || s === '720p' || (!['144', '240', '360', '480', '1080'].includes(s) && !s.includes('144'))) {
      return asset.thumbnails[0].url;
    }
  }

  return null;
}

