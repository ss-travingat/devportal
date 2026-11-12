'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Cpu,
  Film,
  CreditCard,
  BookOpen,
  Activity,
  Gauge,
  LayoutDashboard,
  ExternalLink,
  PanelLeftClose,
  ChevronRight,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useMobileNav } from './MobileNavContext';
import { setSidebarCollapsed, useSidebarCollapsed } from '@/lib/sidebar';

const navItems = [
  { href: '/media-engine', label: 'Media Engine', icon: Cpu },
  { href: '/media-portal', label: 'Media Portal', icon: Film },
  { href: '/service-payments', label: 'Services', icon: CreditCard },
  { href: '/tech-docs', label: 'Tech Docs', icon: BookOpen },
];

const externalItems = [
  { href: 'https://status.travingat.com', label: 'System Status', icon: Activity },
  { href: 'https://grafana.travingat.com', label: 'Observability', icon: Gauge },
];

// Collapse styling only applies from the md breakpoint up; on mobile the sidebar
// is always the full-width slide-over drawer.
const ROW =
  'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors sidebar-collapsed:md:justify-center sidebar-collapsed:md:px-0';
const LABEL = 'sidebar-collapsed:md:hidden';

export default function Navbar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const { open, close } = useMobileNav();
  const collapsed = useSidebarCollapsed();

  if (pathname === '/login' || pathname === '/signin') return null;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
    } catch {}
    finally {
      try {
        document.cookie =
          'admin_session=; Path=/; Domain=.travingat.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie =
          'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch {}
      window.location.replace('/login?logout=1');
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={close}
        />
      )}

      <aside
        // Collapsed rail: clicking empty space (anything that isn't a link or button) expands it
        onClick={(e) => {
          if (!collapsed) return;
          if (!window.matchMedia('(min-width: 768px)').matches) return;
          if ((e.target as HTMLElement).closest('a, button')) return;
          setSidebarCollapsed(false);
        }}
        className={`fixed left-0 top-0 bottom-0 w-[220px] sidebar-collapsed:md:w-16 sidebar-collapsed:md:cursor-e-resize bg-[#0d0d0d] border-r border-zinc-800/60 flex flex-col z-50 transition-[transform,width] duration-200 ease-in-out${
          open ? ' translate-x-0' : ' -translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo + collapse toggle */}
        <div className="px-5 h-[60px] flex items-center justify-between border-b border-zinc-800/40 shrink-0 sidebar-collapsed:md:px-0 sidebar-collapsed:md:justify-center sidebar-collapsed:md:gap-1">
          <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={close} title="Overview">
            <BrandLogo size={20} className="text-white shrink-0" />
            <div className={`flex flex-col leading-none ${LABEL}`}>
              <span className="text-[12px] font-bold tracking-tight text-white">TRAVINGAT</span>
              <span className="text-[9px] font-semibold tracking-[0.14em] text-white/40 uppercase mt-0.5">
                DEVPORTAL
              </span>
            </div>
          </Link>

          {/* Collapse (expanded sidebar, desktop only) */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
            aria-expanded={!collapsed}
            title="Collapse sidebar"
            className={`hidden md:flex p-1.5 -mr-1.5 rounded-md text-white/40 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer ${LABEL}`}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          {/* Expand (collapsed sidebar): small chevron beside the logo */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            aria-expanded={!collapsed}
            title="Expand sidebar"
            className="hidden sidebar-collapsed:md:flex items-center justify-center w-5 h-5 rounded text-white/50 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          <Link
            href="/"
            onClick={close}
            title="Overview"
            className={`${ROW} ${
              pathname === '/'
                ? 'bg-zinc-800/70 text-white'
                : 'text-white/60 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <LayoutDashboard className="w-[15px] h-[15px] shrink-0" />
            <span className={LABEL}>Overview</span>
          </Link>

          <div className="mt-3 mb-1 px-3 sidebar-collapsed:md:px-0 sidebar-collapsed:md:mx-2 sidebar-collapsed:md:mt-2 sidebar-collapsed:md:border-t sidebar-collapsed:md:border-zinc-800/60">
            <span className={`text-[10px] font-semibold tracking-[0.1em] text-white/30 uppercase ${LABEL}`}>
              Tools
            </span>
          </div>

          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                title={label}
                className={`${ROW} ${
                  isActive
                    ? 'bg-zinc-800/70 text-white'
                    : 'text-white/60 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-[15px] h-[15px] shrink-0" />
                <span className={LABEL}>{label}</span>
              </Link>
            );
          })}

          <div className="mt-3 mb-1 px-3 sidebar-collapsed:md:px-0 sidebar-collapsed:md:mx-2 sidebar-collapsed:md:mt-2 sidebar-collapsed:md:border-t sidebar-collapsed:md:border-zinc-800/60">
            <span className={`text-[10px] font-semibold tracking-[0.1em] text-white/30 uppercase ${LABEL}`}>
              External
            </span>
          </div>

          {externalItems.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              title={label}
              className={`${ROW} text-white/60 hover:text-white hover:bg-zinc-800/40`}
            >
              <Icon className="w-[15px] h-[15px] shrink-0" />
              <span className={`flex-1 ${LABEL}`}>{label}</span>
              <ExternalLink className={`w-3 h-3 text-white/20 shrink-0 ${LABEL}`} />
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-zinc-800/40 flex flex-col gap-0.5 shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/40 sidebar-collapsed:md:justify-center sidebar-collapsed:md:px-0"
            title="All Systems Operational"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className={LABEL}>All Systems Operational</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign Out"
            className={`${ROW} text-white/60 hover:text-white hover:bg-zinc-800/40 disabled:opacity-40 cursor-pointer w-full`}
          >
            <LogOut className="w-[15px] h-[15px] shrink-0" />
            <span className={LABEL}>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
