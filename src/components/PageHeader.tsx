'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || pathname === '/') return null;

  const isMediaEngine = pathname.startsWith('/media-engine');
  const isMediaPortal = pathname.startsWith('/media-portal');
  const isServicePayments = pathname.startsWith('/service-payments');
  const isTechDocs = pathname.startsWith('/tech-docs');

  const docSlug = isTechDocs && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;
  const mediaEngineSub = isMediaEngine && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;

  return (
    <div className="sticky top-0 z-30 h-[52px] border-b border-zinc-800/60 bg-[#121212]/95 backdrop-blur-sm flex items-center px-6 gap-1.5 text-[12px] shrink-0">
      <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
        Overview
      </Link>

      {isMediaEngine && (
        <>
          <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
          {mediaEngineSub ? (
            <>
              <Link href="/media-engine" className="text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
                Media Engine
              </Link>
              <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
              <span className="text-zinc-200 font-mono text-[11px] truncate max-w-[260px]">{mediaEngineSub}</span>
            </>
          ) : (
            <span className="text-zinc-200 font-medium">Media Engine</span>
          )}
        </>
      )}

      {isMediaPortal && (
        <>
          <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
          <span className="text-zinc-200 font-medium">Media Portal</span>
        </>
      )}

      {isServicePayments && (
        <>
          <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
          <span className="text-zinc-200 font-medium">Service Payments</span>
        </>
      )}

      {isTechDocs && (
        <>
          <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
          {docSlug ? (
            <>
              <Link href="/tech-docs" className="text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
                Tech Documentation
              </Link>
              <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
              <span className="text-zinc-200 font-medium capitalize truncate max-w-[260px]">
                {docSlug.replace(/-/g, ' ')}
              </span>
            </>
          ) : (
            <span className="text-zinc-200 font-medium">Tech Documentation</span>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => router.back()}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer shrink-0"
      >
        ← Back
      </button>
    </div>
  );
}
