'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, LogOut, Menu } from 'lucide-react';
import { useMobileNav } from './MobileNavContext';
import { signOut } from '@/lib/sign-out';

// Crumbs never wrap: links keep their width, and only the current page truncates.
const LINK = 'shrink-0 text-white/50 hover:text-white transition-colors font-medium';
const CURRENT = 'min-w-0 truncate text-white font-medium';

function Sep({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  return (
    <ChevronRight
      className={`w-3 h-3 text-white/20 shrink-0${hideOnMobile ? ' hidden sm:block' : ''}`}
    />
  );
}

export default function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useMobileNav();
  const [signingOut, setSigningOut] = useState(false);

  if (!pathname) return null;

  // Home has no breadcrumb. On phones it still needs a top bar, otherwise there is
  // no menu button and no way to reach Sign Out (which otherwise lives in the drawer).
  if (pathname === '/') {
    return (
      <div className="md:hidden sticky top-0 z-30 h-[52px] border-b border-zinc-800/60 bg-[#121212]/95 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <button
          type="button"
          onClick={toggle}
          className="p-1.5 -ml-1.5 rounded-md text-white/60 hover:text-white hover:bg-zinc-800/40 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={async () => {
            if (signingOut) return;
            setSigningOut(true);
            await signOut();
          }}
          disabled={signingOut}
          className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-md text-[12px] leading-none font-medium text-white/60 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    );
  }

  const isMediaEngine = pathname.startsWith('/media-engine');
  const isMediaPortal = pathname.startsWith('/media-portal');
  const isServicePayments = pathname.startsWith('/service-payments');
  const isTechDocs = pathname.startsWith('/tech-docs');

  const docSlug = isTechDocs && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;
  const mediaEngineSub = isMediaEngine && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;
  // "0-Tech-Stack-Glance" -> "Tech Stack Glance" (the leading number is only for file ordering)
  const docName = docSlug ? docSlug.replace(/^\d+-/, '').replace(/-/g, ' ') : null;

  return (
    <div className="sticky top-0 z-30 h-[52px] border-b border-zinc-800/60 bg-[#121212]/95 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 text-[12px] shrink-0">
      <button
        type="button"
        onClick={toggle}
        className="md:hidden p-1.5 rounded-md text-white/60 hover:text-white hover:bg-zinc-800/40 transition-colors shrink-0"
        aria-label="Open navigation"
      >
        <Menu className="w-4 h-4" />
      </button>

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 flex-1 whitespace-nowrap">
        {/* "Overview" is dropped on phones to leave room for the page name */}
        <Link href="/" className={`${LINK} hidden sm:inline`}>
          Overview
        </Link>

        {isMediaEngine && (
          <>
            <Sep hideOnMobile />
            {mediaEngineSub ? (
              <>
                <Link href="/media-engine" className={LINK}>
                  Media Engine
                </Link>
                <Sep />
                <span className={`${CURRENT} font-mono text-[11px] max-w-[260px]`}>{mediaEngineSub}</span>
              </>
            ) : (
              <span className={CURRENT}>Media Engine</span>
            )}
          </>
        )}

        {isMediaPortal && (
          <>
            <Sep hideOnMobile />
            <span className={CURRENT}>Media Portal</span>
          </>
        )}

        {isServicePayments && (
          <>
            <Sep hideOnMobile />
            <span className={CURRENT}>Service Payments</span>
          </>
        )}

        {isTechDocs && (
          <>
            <Sep hideOnMobile />
            {docName ? (
              <>
                <Link href="/tech-docs" className={LINK}>
                  Tech Docs
                </Link>
                <Sep />
                <span className={`${CURRENT} capitalize max-w-[260px]`}>{docName}</span>
              </>
            ) : (
              <span className={CURRENT}>Tech Documentation</span>
            )}
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-md text-[12px] leading-none font-medium text-white/60 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
      >
        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
        Back
      </button>
    </div>
  );
}
