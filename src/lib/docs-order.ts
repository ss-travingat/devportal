import { DocMeta } from '@/types/docs';

const CATEGORY_ORDER = ['Overview', 'Platform', 'Product', 'Operations', 'General'];

/**
 * Groups docs by category in the order used across Tech Docs:
 * known categories first (CATEGORY_ORDER), then the rest alphabetically.
 * Docs keep their incoming order within a category.
 */
export function groupDocsByCategory(docs: DocMeta[]): Map<string, DocMeta[]> {
  const map = new Map<string, DocMeta[]>();
  for (const doc of docs) {
    const cat = doc.category || 'General';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(doc);
  }
  return new Map(
    [...map.entries()].sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
  );
}

/** Flat reading order (matches the grouped list), used for the Next button. */
export function readingOrder(docs: DocMeta[]): DocMeta[] {
  return [...groupDocsByCategory(docs).values()].flat();
}
