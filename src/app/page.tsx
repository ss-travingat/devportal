'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  BookOpen,
  ArrowRight,
  Activity,
  Gauge,
  ExternalLink,
  Film,
  Cpu,
  TrendingDown,
  Upload,
  Layers,
  DollarSign,
} from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { DocMeta } from '@/types/docs';
import { EngineStats } from '@/types/media';
import { loadSubscriptions, saveSubscriptions } from '@/lib/storage';

export default function HomePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions());
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [liveUploadsCount, setLiveUploadsCount] = useState<number | null>(null);
  const [engineStats, setEngineStats] = useState<EngineStats | null>(null);

  useEffect(() => {
    fetch('/api/media-engine/stats')
      .then((res) => res.json())
      .then((data) => { if (data && typeof data.total_media === 'number') setEngineStats(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/subscriptions')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) { setSubscriptions(data); saveSubscriptions(data); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data: DocMeta[]) => { if (Array.isArray(data)) setDocs(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/media-engine/uploads?filter=live')
      .then((res) => res.json())
      .then((data) => { if (typeof data.total === 'number') setLiveUploadsCount(data.total); })
      .catch(() => {});
  }, []);

  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const totalAmount = subscriptions
    .filter((s) => s.status === 'Active')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="px-8 py-8 max-w-[1200px] w-full">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight text-white">Developer Control Plane</h1>
        <p className="text-[13px] text-white/60 mt-1">
          Infrastructure, media pipeline, and cloud services for Travingat.
        </p>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white uppercase tracking-[0.08em]">Media Assets</span>
            <Layers className="w-3.5 h-3.5 text-white/40" />
          </div>
          <div className="text-[28px] font-bold text-white leading-none font-mono">
            {engineStats ? engineStats.total_media.toLocaleString() : '—'}
          </div>
          <div className="text-[11px] text-white/40 mt-1.5">Total processed</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white uppercase tracking-[0.08em]">Compression</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-[28px] font-bold text-emerald-400 leading-none font-mono">
            {engineStats ? `${engineStats.savings_pct}%` : '—'}
          </div>
          <div className="text-[11px] text-white/40 mt-1.5">Average savings</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white uppercase tracking-[0.08em]">Live Uploads</span>
            <Upload className="w-3.5 h-3.5 text-white/40" />
          </div>
          <div className="text-[28px] font-bold text-white leading-none font-mono">
            {liveUploadsCount !== null ? liveUploadsCount.toLocaleString() : '—'}
          </div>
          <div className="text-[11px] text-white/40 mt-1.5">15-min retention</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white uppercase tracking-[0.08em]">Monthly Spend</span>
            <DollarSign className="w-3.5 h-3.5 text-white/40" />
          </div>
          <div className="text-[28px] font-bold text-white leading-none font-mono">
            {totalAmount > 0
              ? `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : '—'}
          </div>
          <div className="text-[11px] text-white/40 mt-1.5">{activeCount} active services</div>
        </div>
      </div>

      {/* Section label */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">Modules</span>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Media Engine */}
        <Link
          href="/media-engine"
          className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white font-semibold">
                  {engineStats ? `${engineStats.total_media.toLocaleString()} Assets` : 'Online'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-[15px] font-semibold text-white">Media Engine</h2>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/60 text-white border border-zinc-700/40">
                Core
              </span>
            </div>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Real-time image &amp; video optimization pipeline, Celery queues, multi-resolution thumbnails, and recycle bin management.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[12px]">
            <span className="text-white/40">
              Savings:{' '}
              <strong className="text-emerald-400 font-mono">{engineStats ? `${engineStats.savings_pct}%` : '—'}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              Open Console <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Media Portal */}
        <Link
          href="/media-portal"
          className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white">
                {liveUploadsCount !== null ? `${liveUploadsCount} Live` : 'Live'}
              </span>
            </div>

            <h2 className="text-[15px] font-semibold text-white mb-1.5">Media Portal</h2>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Upload and optimize images, configure thumbnails, monitor live retention tags, and download photos or packaged ZIPs.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-end text-[12px]">
            <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              Open Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Service Payments */}
        <Link
          href="/service-payments"
          className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white">
                {activeCount} Active
              </span>
            </div>

            <h2 className="text-[15px] font-semibold text-white mb-1.5">Service Payments</h2>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Track recurring cloud vendor subscriptions, infrastructure billing cycles, owners, and cancellation timelines.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[12px]">
            <span className="text-white/40 font-mono">
              ${totalAmount > 0 ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}/mo
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              View Services <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Tech Documentation */}
        <Link
          href="/tech-docs"
          className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white">
                {docs.length > 0 ? `${docs.length} Docs` : 'Docs'}
              </span>
            </div>

            <h2 className="text-[15px] font-semibold text-white mb-1.5">Tech Documentation</h2>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Internal architecture guides, data model references, runbooks, and API documentation with live Mermaid diagrams.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-end text-[12px]">
            <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              View Docs <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Services Status */}
        <a
          href="https://status.travingat.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <h2 className="text-[15px] font-semibold text-white mb-1.5">Services Status</h2>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Real-time platform health, uptime checks, maintenance schedules, and active incident updates across all services.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[12px]">
            <span className="text-white/30 font-mono text-[11px]">status.travingat.com</span>
            <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              Open <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </a>

        {/* Observability */}
        <a
          href="https://grafana.travingat.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg">
                <Gauge className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-800/40 text-white">
                Grafana
              </span>
            </div>

            <h2 className="text-[15px] font-semibold text-white mb-1.5">Observability</h2>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Performance dashboards, system resource metrics, query throughput, and infrastructure telemetry.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[12px]">
            <span className="text-white/30 font-mono text-[11px]">grafana.travingat.com</span>
            <span className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              Open <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </a>

      </div>
    </div>
  );
}
