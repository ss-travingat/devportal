'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ArrowLeft } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Do not render navbar on login / signin screens
  if (pathname === '/login' || pathname === '/signin') {
    return null;
  }

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
      router.replace('/login');
      router.refresh();
    }
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

        {/* Top Right: Logout or Back */}
        <div className="flex items-center gap-2.5">
          {!isHome && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors disabled:opacity-50"
            title="Sign out of shared admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
