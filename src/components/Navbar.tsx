'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, Cpu, Film, CreditCard, BookOpen } from 'lucide-react';
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
      // Clear client-accessible cookie variants if any
      try {
        document.cookie = 'admin_session=; Path=/; Domain=.travingat.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch {
        // Ignore in non-browser env
      }
      // Hard navigation to /login?logout=1 to force full page reload and bypass cached middleware state
      window.location.replace('/login?logout=1');
    }
  };

  const isHome = pathname === '/';
  const isMediaEngine = pathname.startsWith('/media-engine');
  const isServicePayments = pathname.startsWith('/service-payments');
  const isTechDocs = pathname.startsWith('/tech-docs');
  const isMediaPortal = pathname.startsWith('/media-portal');

  // Extract subpath for tech docs or media engine if nested
  const docSlug = isTechDocs && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;
  const mediaEngineSub = isMediaEngine && pathname.split('/')[2] ? decodeURIComponent(pathname.split('/')[2]) : null;

  const handleBack = () => {
    if (docSlug) {
      router.push('/tech-docs');
    } else if (mediaEngineSub) {
      router.push('/media-engine');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#121212]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-white hover:text-zinc-300 transition-colors flex items-center gap-2.5 shrink-0"
          >
            <BrandLogo size={24} className="text-white shrink-0" />
            <span>Devportal</span>
          </Link>

          {isMediaEngine && (
            <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2 min-w-0">
              <span>/</span>
              {mediaEngineSub ? (
                <>
                  <Link
                    href="/media-engine"
                    className="text-zinc-400 font-medium hover:text-white transition-colors shrink-0"
                  >
                    Media Engine
                  </Link>
                  <span>/</span>
                  <span className="text-zinc-200 font-medium font-mono text-[11px] truncate max-w-[180px]">
                    {mediaEngineSub}
                  </span>
                </>
              ) : (
                <span className="text-blue-400 font-medium">Media Engine</span>
              )}
            </div>
          )}

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

        {/* Center / Navigation Cards/Links in Navbar */}
        <nav className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg">
          {/* Media Engine Navbar Card */}
          <Link
            href="/media-engine"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
              isMediaEngine
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-sm shadow-blue-500/10'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Media Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Pipeline active" />
          </Link>

          <Link
            href="/media-portal"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
              isMediaPortal
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-zinc-400" />
            <span>Media Portal</span>
          </Link>

          <Link
            href="/service-payments"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
              isServicePayments
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
            <span>Services</span>
          </Link>

          <Link
            href="/tech-docs"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
              isTechDocs
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Docs</span>
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isHome && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
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
