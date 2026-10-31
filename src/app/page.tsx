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
} from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { DocMeta } from '@/types/docs';
import { loadSubscriptions, saveSubscriptions } from '@/lib/storage';

export default function HomePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions());
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [liveUploadsCount, setLiveUploadsCount] = useState<number>(0);

  // Load subscriptions from JSON via API on mount
  useEffect(() => {
    fetch('/api/subscriptions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubscriptions(data);
          saveSubscriptions(data);
        }
      })
      .catch((err) => console.error('Failed to load from subscriptions.json:', err));
  }, []);

  // Load docs list on mount
  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data: DocMeta[]) => {
        if (Array.isArray(data)) setDocs(data);
      })
      .catch((err) => console.error('Failed to load docs list:', err));
  }, []);

  // Load live uploads count
  useEffect(() => {
    fetch('/api/media-engine/uploads?filter=live')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === 'number') {
          setLiveUploadsCount(data.total);
        }
      })
      .catch(() => { });
  }, []);

  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const totalAmount = subscriptions
    .filter((s) => s.status === 'Active')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Developer Portal</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Centralized management for developer infrastructure, media pipelines, and cloud services.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Media Portal & Optimizer */}
        <Link
          href="/media-portal"
          className="group relative p-6 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-md">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                {liveUploadsCount} Live
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors">
              Media Portal
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Upload and optimize images, configure thumbnail creation, monitor 15-minute live retention tags, and download individual photos or packaged ZIPs.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">
              Media Engine
            </span>
            <div className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              <span>Open Media</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Service Payments */}
        <Link
          href="/service-payments"
          className="group relative p-6 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-md">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                {activeCount} Active
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors">
              Service Payments
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Track, manage, and configure recurring cloud vendor subscriptions, infrastructure
              billing cycles, owners, and cancellation timelines.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Est. Active Monthly:{' '}
              <strong className="text-zinc-200 font-mono">
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <div className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              <span>View Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* Card 3: Tech Documentation */}
        <Link
          href="/tech-docs"
          className="group relative p-6 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                {docs.length} Docs
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors">
              Tech Documentation
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Browse internal technical guides, architecture diagrams, and API references with
              live Mermaid diagram rendering.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-end text-xs">
            <div className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              <span>View Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* Card 4: Services Status */}
        <a
          href="https://status.travingat.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live Status
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors">
              Services Status
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Real-time platform health, operational uptime checks, maintenance schedules,
              and active incident updates across all microservices.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">
              status.travingat.com
            </span>
            <div className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              <span>Open Status</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </a>

        {/* Card 5: Observability */}
        <a
          href="https://grafana.travingat.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-md">
                <Gauge className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                Grafana
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors">
              Observability
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Interactive Grafana performance dashboards, system resource metrics, query throughput,
              and infrastructure telemetry.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">
              grafana.travingat.com
            </span>
            <div className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
              <span>Open Grafana</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
