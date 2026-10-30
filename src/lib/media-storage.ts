import { MediaAsset } from '@/types/media';
import initialMedia from '@/data/media.json';

const STORAGE_KEY = 'devportal_media_assets_v1';

export function loadMediaAssets(): MediaAsset[] {
  if (typeof window === 'undefined') {
    return initialMedia as MediaAsset[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMedia));
      return initialMedia as MediaAsset[];
    }
    return JSON.parse(raw);
  } catch {
    return initialMedia as MediaAsset[];
  }
}

export function saveMediaAssets(assets: MediaAsset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    console.error('Failed to save media assets:', err);
  }
}

