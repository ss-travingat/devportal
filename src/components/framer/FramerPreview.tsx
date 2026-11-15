'use client';

import dynamic from 'next/dynamic';

// Same relative endpoint the landing app's own proxy exposes (src/app/api/[...path]/route.ts
// in travingat-landing rewrites /api/* to BACKEND_URL) — pointed at app.travingat.com so the
// waitlist bars post exactly where they do when live on the Framer site.
const WAITLIST_API_URL = 'https://app.travingat.com/api/waitlist';

const Waitlist = dynamic(() => import('./Waitlist'), { ssr: false });
const WaitlistBarFramer = dynamic(() => import('./WaitlistBarFramer'), { ssr: false });
const DesktopWaitlist = dynamic(() => import('./desktop-waitlist'), { ssr: false });
const MobileWaitlist = dynamic(() => import('./mobile-waitlist'), { ssr: false });
const GetFeatured = dynamic(() => import('./getfeaturedMono'), { ssr: false });

export default function FramerPreview({ slug }: { slug: string }) {
  switch (slug) {
    case 'waitlist':
      return <Waitlist apiUrl={WAITLIST_API_URL} />;
    case 'waitlist-bar-framer':
      return <WaitlistBarFramer apiUrl={WAITLIST_API_URL} />;
    case 'desktop-waitlist':
      return <DesktopWaitlist apiUrl={WAITLIST_API_URL} />;
    case 'mobile-waitlist':
      return <MobileWaitlist apiUrl={WAITLIST_API_URL} />;
    case 'get-featured':
      return <GetFeatured />;
    default:
      return null;
  }
}
