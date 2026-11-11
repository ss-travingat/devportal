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
} from 'lucide-react';
import BrandLogo from './BrandLogo';

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

export default function Navbar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0d0d0d] border-r border-zinc-800/60 flex flex-col z-40">
        {/* Logo */}
        <div className="px-5 h-[60px] flex items-center border-b border-zinc-800/40 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo size={20} className="text-white shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[12px] font-bold tracking-tight text-white">TRAVINGAT</span>
              <span className="text-[9px] font-semibold tracking-[0.14em] text-white/40 uppercase mt-0.5">
                DEVPORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              pathname === '/'
                ? 'bg-zinc-800/70 text-white'
                : 'text-white/60 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <LayoutDashboard className="w-[15px] h-[15px] shrink-0" />
            <span>Overview</span>
          </Link>

          <div className="mt-3 mb-1 px-3">
            <span className="text-[10px] font-semibold tracking-[0.1em] text-white/30 uppercase">
              Tools
            </span>
          </div>

          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/70 text-white'
                    : 'text-white/60 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-[15px] h-[15px] shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="mt-3 mb-1 px-3">
            <span className="text-[10px] font-semibold tracking-[0.1em] text-white/30 uppercase">
              External
            </span>
          </div>

          {externalItems.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-white/60 hover:text-white hover:bg-zinc-800/40 transition-colors"
            >
              <Icon className="w-[15px] h-[15px] shrink-0" />
              <span className="flex-1">{label}</span>
              <ExternalLink className="w-3 h-3 text-white/20 shrink-0" />
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-zinc-800/40 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span>All Systems Operational</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-white/60 hover:text-white hover:bg-zinc-800/40 transition-colors disabled:opacity-40 cursor-pointer w-full"
          >
            <LogOut className="w-[15px] h-[15px] shrink-0" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
  );
}
