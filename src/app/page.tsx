'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  BookOpen,
  Plus,
  ArrowRight,
  LogOut,
  CheckCircle2,
  ArrowLeft,
  Activity,
  Gauge,
  ExternalLink,
  Film,
} from 'lucide-react';
import { Subscription, SubscriptionFormData } from '@/types/subscription';
import { DocMeta, DocDetail } from '@/types/docs';
import { MediaAsset } from '@/types/media';
import { loadSubscriptions, saveSubscriptions } from '@/lib/storage';
import { loadMediaAssets, saveMediaAssets } from '@/lib/media-storage';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionFormModal from '@/components/SubscriptionFormModal';
import SubscriptionDetailModal from '@/components/SubscriptionDetailModal';
import SubscriptionMetrics from '@/components/SubscriptionMetrics';
import TechDocsList from '@/components/TechDocsList';
import MarkdownViewer from '@/components/MarkdownViewer';
import BrandLogo from '@/components/BrandLogo';
import MediaUploadModal from '@/components/MediaUploadModal';
import MediaPortalView from '@/components/MediaPortalView';

type CurrentView = 'home' | 'service-payments' | 'tech-docs' | 'media-portal';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions());

  // Subscription modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  const [detailSubscription, setDetailSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Logout notice
  const [logoutNotice, setLogoutNotice] = useState(false);

  // Media Portal & Upload state
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => loadMediaAssets());
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);

  const handleUploadMediaSuccess = (newAssets: MediaAsset[]) => {
    const updated = [...newAssets, ...mediaAssets];
    setMediaAssets(updated);
    saveMediaAssets(updated);
  };

  const handleDeleteMediaAsset = (id: string) => {
    const updated = mediaAssets.filter((a) => a.id !== id);
    setMediaAssets(updated);
    saveMediaAssets(updated);
  };

  // Tech docs state
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocDetail | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

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

  const handleSelectDoc = async (slug: string) => {
    setDocLoading(true);
    setDocError('');
    setSelectedDoc(null);
    try {
      const res = await fetch(`/api/docs?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`Failed to load document: ${res.statusText}`);
      const data: DocDetail = await res.json();
      setSelectedDoc(data);
    } catch (err) {
      setDocError(String(err));
    } finally {
      setDocLoading(false);
    }
  };

  const handleBackToDocList = () => {
    setSelectedDoc(null);
    setDocError('');
  };

  const handleCreateOrUpdate = async (data: SubscriptionFormData, editId?: string) => {
    if (editId) {
      try {
        const res = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...data }),
        });
        const resData = await res.json();
        if (res.ok && resData.subscription) {
          const updated = subscriptions.map((s) => (s.id === editId ? resData.subscription : s));
          setSubscriptions(updated);
          saveSubscriptions(updated);
          return;
        }
      } catch (err) {
        console.error('API update failed:', err);
      }
      // Fallback
      const timestamp = new Date().toISOString();
      const updated = subscriptions.map((sub) =>
        sub.id === editId ? { ...sub, ...data, updatedAt: timestamp } : sub
      );
      setSubscriptions(updated);
      saveSubscriptions(updated);
    } else {
      try {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (res.ok && resData.subscription) {
          const updated = [resData.subscription, ...subscriptions];
          setSubscriptions(updated);
          saveSubscriptions(updated);
          return;
        }
      } catch (err) {
        console.error('API create failed:', err);
      }
      // Fallback
      const timestamp = new Date().toISOString();
      const newRecord: Subscription = {
        ...data,
        id: `sub-${Date.now()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const updated = [newRecord, ...subscriptions];
      setSubscriptions(updated);
      saveSubscriptions(updated);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('API delete failed:', err);
    }
    const updated = subscriptions.filter((s) => s.id !== id);
    setSubscriptions(updated);
    saveSubscriptions(updated);
  };

  const handleOpenEdit = (subscription: Subscription) => {
    setSubscriptionToEdit(subscription);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setSubscriptionToEdit(null);
    setIsFormOpen(true);
  };

  const handleViewDetails = (subscription: Subscription) => {
    setDetailSubscription(subscription);
    setIsDetailOpen(true);
  };

  const handleLogout = () => {
    setLogoutNotice(true);
    setTimeout(() => {
      setLogoutNotice(false);
    }, 3500);
  };

  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const totalAmount = subscriptions
    .filter((s) => s.status === 'Active')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#121212]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Top Left: Devportal + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentView('home');
                handleBackToDocList();
              }}
              className="text-lg font-bold tracking-tight text-white hover:text-zinc-300 transition-colors flex items-center gap-2.5"
            >
              <BrandLogo size={24} className="text-white shrink-0" />
              <span>Devportal</span>
            </button>
            {currentView === 'service-payments' && (
              <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2">
                <span>/</span>
                <span className="text-zinc-300 font-medium">Service Payments</span>
              </div>
            )}
            {currentView === 'tech-docs' && (
              <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2">
                <span>/</span>
                <span
                  className="text-zinc-300 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={handleBackToDocList}
                >
                  Tech Documentation
                </span>
                {selectedDoc && (
                  <>
                    <span>/</span>
                    <span className="text-zinc-400 truncate max-w-[180px]">{selectedDoc.title}</span>
                  </>
                )}
              </div>
            )}
            {currentView === 'media-portal' && (
              <div className="flex items-center text-xs text-zinc-500 gap-1.5 ml-2">
                <span>/</span>
                <span className="text-zinc-300 font-medium">Media Portal</span>
              </div>
            )}
          </div>

          {/* Top Right: Logout (on home only) or Back (on subpages) */}
          <div className="flex items-center gap-3">
            {currentView === 'home' ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (currentView === 'tech-docs' && selectedDoc) {
                    handleBackToDocList();
                  } else {
                    setCurrentView('home');
                  }
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Logout Notice banner */}
      {logoutNotice && (
        <div className="bg-zinc-900 border-b border-zinc-800 py-2.5 px-4 text-center text-xs text-zinc-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Session securely logged out. You can sign back into Devportal at any time.</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HOME VIEW ── */}
        {currentView === 'home' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Developer Portal</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Centralized management for developer infrastructure, media pipelines, and cloud services.
              </p>
            </div>

            {/* Top Featured Action Card: Media Upload with Big Plus Icon */}
            <div
              onClick={() => setIsMediaUploadOpen(true)}
              className="group relative p-6 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-600 rounded-xl cursor-pointer transition-all duration-200 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-dashed"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-zinc-500 transition-all shadow-inner">
                  <Plus className="w-8 h-8 text-white stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white group-hover:text-zinc-100 transition-colors">
                      Media Upload
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                      Cloudflare R2
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Quickly upload creator images, banner photography, video reels, and passport card assets directly to the R2 asset pipeline.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white group-hover:bg-zinc-200 rounded-md transition-colors shadow"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Upload Files</span>
                </button>
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Card 1: Media Portal */}
              <div
                onClick={() => setCurrentView('media-portal')}
                className="group relative p-6 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-md">
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                      {mediaAssets.length} Assets
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors">
                    Media Portal
                  </h2>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Browse, inspect, and organize stored Cloudflare R2 bucket media, thumbnail variants,
                    and CDN distributions.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    travingat-prod-media
                  </span>
                  <div className="inline-flex items-center gap-1 font-medium text-white group-hover:translate-x-0.5 transition-transform">
                    <span>Open Media</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Card 2: Service Payments */}
              <div
                onClick={() => setCurrentView('service-payments')}
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
              </div>

              {/* Card 3: Tech Documentation */}
              <div
                onClick={() => setCurrentView('tech-docs')}
                className="group relative p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
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
              </div>

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
        )}

        {/* ── SERVICE PAYMENTS VIEW ── */}
        {currentView === 'service-payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Service Payments
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Track subscriptions, vendor renewal schedules, and ownership accountability.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shadow"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Subscription</span>
                </button>
              </div>
            </div>

            <SubscriptionMetrics subscriptions={subscriptions} />

            <SubscriptionTable
              subscriptions={subscriptions}
              onAddNew={handleOpenAdd}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onView={handleViewDetails}
            />
          </div>
        )}

        {/* ── TECH DOCS VIEW ── */}
        {currentView === 'tech-docs' && (
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
              <div>
                {selectedDoc ? (
                  <>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                      {selectedDoc.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                      {selectedDoc.category && (
                        <span className="font-mono uppercase tracking-wider">
                          {selectedDoc.category}
                        </span>
                      )}
                      {selectedDoc.author && <span>by {selectedDoc.author}</span>}
                      {selectedDoc.updatedAt && <span>Updated: {selectedDoc.updatedAt}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      Tech Documentation
                    </h1>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Internal technical guides, architecture diagrams, and API references.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Doc list or viewer */}
            {!selectedDoc && !docLoading && !docError && (
              <TechDocsList docs={docs} onSelect={handleSelectDoc} />
            )}

            {docLoading && (
              <div className="py-16 flex flex-col items-center gap-3 text-zinc-500 text-sm">
                <span className="animate-pulse text-2xl">◌</span>
                <span>Loading document...</span>
              </div>
            )}

            {docError && (
              <div className="py-8 px-4 border border-zinc-800 rounded-lg bg-zinc-950 text-sm text-zinc-400">
                <p className="font-medium text-zinc-200 mb-1">Failed to load document</p>
                <p className="font-mono text-xs">{docError}</p>
                <button
                  onClick={handleBackToDocList}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to docs list
                </button>
              </div>
            )}

            {selectedDoc && !docLoading && (
              <div className="pb-12">
                <MarkdownViewer content={selectedDoc.content} />
              </div>
            )}
          </div>
        )}

        {/* ── MEDIA PORTAL VIEW ── */}
        {currentView === 'media-portal' && (
          <MediaPortalView
            assets={mediaAssets}
            onOpenUpload={() => setIsMediaUploadOpen(true)}
            onDeleteAsset={handleDeleteMediaAsset}
          />
        )}
      </main>

      {/* Modals */}
      <MediaUploadModal
        isOpen={isMediaUploadOpen}
        onClose={() => setIsMediaUploadOpen(false)}
        onUploadSuccess={handleUploadMediaSuccess}
      />

      <SubscriptionFormModal
        key={isFormOpen ? (subscriptionToEdit?.id ?? 'create') : 'closed'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleCreateOrUpdate}
        subscriptionToEdit={subscriptionToEdit}
      />

      <SubscriptionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        subscription={detailSubscription}
        onEdit={(sub) => {
          setIsDetailOpen(false);
          handleOpenEdit(sub);
        }}
      />
    </div>
  );
}
