// Registry of Framer code components mirrored (unmodified) from
// ../travingat-landing/src/components/framer/ for live preview + download in devportal.
//
// Server-safe (no React imports) — used by both the listing page and the
// download API route. The actual component modules are dynamically imported
// client-side from FramerPreview.tsx, keyed by `file`.

export type FramerComponentMeta = {
  slug: string;
  title: string;
  description: string;
  file: string; // filename under src/components/framer/
};

export const FRAMER_COMPONENTS: FramerComponentMeta[] = [
  {
    slug: 'waitlist',
    title: 'Waitlist',
    description: 'Pill-shaped email waitlist bar with inline status message.',
    file: 'Waitlist.tsx',
  },
  {
    slug: 'waitlist-bar-framer',
    title: 'Waitlist Bar (Framer)',
    description: 'Email capture bar variant for the Framer marketing site.',
    file: 'WaitlistBarFramer.tsx',
  },
  {
    slug: 'desktop-waitlist',
    title: 'Desktop Waitlist',
    description: 'Desktop layout variant of the waitlist email capture bar.',
    file: 'desktop-waitlist.tsx',
  },
  {
    slug: 'mobile-waitlist',
    title: 'Mobile Waitlist',
    description: 'Mobile layout variant of the waitlist email capture bar.',
    file: 'mobile-waitlist.tsx',
  },
  {
    slug: 'get-featured',
    title: 'Get Featured',
    description: 'Full email → OTP → application → status flow for Get Featured.',
    file: 'getfeaturedMono.tsx',
  },
];

export function getFramerComponent(slug: string): FramerComponentMeta | undefined {
  return FRAMER_COMPONENTS.find((c) => c.slug === slug);
}
