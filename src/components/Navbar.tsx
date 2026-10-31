'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, CheckCircle2 } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutNotice, setLogoutNotice] = useState(false);

  const handleLogout = () => {
    setLogoutNotice(true);
    setTimeout(() => {
      setLogoutNotice(false);
    }, 3500);
  };

  const isHome = pathname === '/';
  const isServicePayments = pathname.startsWith('/service-payments');
  const isTechDocs = pathname.startsWith('/tech-docs');
  const isMediaPortal = pathname.startsWith('/media-portal');

  // Extract subpath for tech docs if [slug]
  const docSlug = isTechDocs && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;

  const handleBack = () => {
    if (docSlug) {
      router.push('/tech-docs');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#121212]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Top Left: Devportal + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-white hover:text-zinc-300 transition-colors flex items-center gap-2.5"
            >
              <BrandLogo size={24} className="text-white shrink-0" />
              <span>Devportal</span>
            </Link>

            {isServicePayments && (
              <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2">
                <span>/</span>
                <span className="text-zinc-300 font-medium">Service Payments</span>
              </div>
            )}

            {isTechDocs && (
              <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2">
                <span>/</span>
                {docSlug ? (
                  <>
                    <Link
                      href="/tech-docs"
                      className="text-zinc-400 font-medium hover:text-white transition-colors"
                    >
                      Tech Documentation
                    </Link>
                    <span>/</span>
                    <span className="text-zinc-200 font-medium capitalize truncate max-w-[200px]">
                      {docSlug.replace(/-/g, ' ')}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-300 font-medium">Tech Documentation</span>
                )}
              </div>
            )}

            {isMediaPortal && (
              <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2">
                <span>/</span>
                <span className="text-zinc-300 font-medium">Media Portal</span>
              </div>
            )}
          </div>

          {/* Top Right: Logout (on home only) or Back (on subpages) */}
          <div className="flex items-center gap-3">
            {isHome ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {logoutNotice && (
        <div className="bg-zinc-900 border-b border-zinc-800 py-2.5 px-4 text-center text-xs text-zinc-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Session securely logged out. You can sign back into Devportal at any time.</span>
        </div>
      )}
    </>
  );
}

