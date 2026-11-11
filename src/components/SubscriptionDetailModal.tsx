'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, Calendar, User, Mail, Edit2, RefreshCw, Tag } from 'lucide-react';
import { Subscription } from '@/types/subscription';

interface SubscriptionDetailModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (sub: Subscription) => void;
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <span className="text-white/40 w-[140px] shrink-0">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

export default function SubscriptionDetailModal({ subscription, isOpen, onClose, onEdit }: SubscriptionDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { window.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [isOpen, onClose]);

  if (!isOpen || !subscription) return null;

  const isFree = Boolean(subscription.isFree || subscription.billingFrequency === 'Free' || Number(subscription.amount) === 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-[#111111] border border-zinc-800/80 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-800/60 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-[16px] font-semibold text-white">{subscription.vendor}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                subscription.status === 'Active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                subscription.status === 'Cancelled' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                subscription.status === 'Trial' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                'border-zinc-700 bg-zinc-800 text-white/60'
              }`}>
                {subscription.status}
              </span>
              {isFree && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  Free
                </span>
              )}
            </div>
            <p className="text-[12px] text-white/50">{subscription.purpose || subscription.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-white/40 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">

          {/* Metric tiles */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Amount</p>
              {isFree ? (
                <p className="text-[15px] font-bold text-emerald-400">Free</p>
              ) : (
                <p className="text-[15px] font-bold text-white font-mono">{subscription.currency} {Number(subscription.amount).toFixed(2)}</p>
              )}
            </div>
            <div className="p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Frequency</p>
              <p className="text-[15px] font-bold text-white">{isFree ? 'Free' : subscription.billingFrequency}</p>
            </div>
            <div className="p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Auto-renewal</p>
              <p className="text-[15px] font-bold text-white">{subscription.autoRenewal || (isFree ? 'N/A' : 'On')}</p>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            {subscription.plan && (
              <div className="flex items-center gap-2 text-[12px]">
                <Tag className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/40 w-[132px] shrink-0">Plan</span>
                <span className="text-white font-medium">{subscription.plan}</span>
              </div>
            )}
            {subscription.nextBillingDate && (
              <div className="flex items-center gap-2 text-[12px]">
                <Calendar className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/40 w-[132px] shrink-0">Next billing date</span>
                <span className="text-white font-medium">{subscription.nextBillingDate}</span>
              </div>
            )}
            {subscription.ownerEmail && (
              <div className="flex items-center gap-2 text-[12px]">
                <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/40 w-[132px] shrink-0">Account / owner email</span>
                <span className="text-white font-medium">{subscription.ownerEmail}</span>
              </div>
            )}
            {subscription.billingEmail && (
              <div className="flex items-center gap-2 text-[12px]">
                <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/40 w-[132px] shrink-0">Billing email</span>
                <span className="text-white font-medium">{subscription.billingEmail}</span>
              </div>
            )}
            {(subscription.responsiblePerson || subscription.owner) && (
              <div className="flex items-center gap-2 text-[12px]">
                <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/40 w-[132px] shrink-0">Responsible person</span>
                <span className="text-white font-medium">{subscription.responsiblePerson || subscription.owner}</span>
              </div>
            )}
            {subscription.vendorUrl && (
              <div className="flex items-center gap-2 text-[12px]">
                <ExternalLink className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/40 w-[132px] shrink-0">Dashboard URL</span>
                <a href={subscription.vendorUrl} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-white/70 underline underline-offset-2 truncate">
                  {subscription.vendorUrl}
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          {subscription.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Notes</p>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-[12px] text-white/70 leading-relaxed">
                {subscription.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/60 shrink-0">
          <span className="text-[10px] text-white/20 font-mono">{subscription.id}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { onClose(); onEdit(subscription); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white/70 bg-zinc-800/60 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-700/40 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-[12px] font-semibold text-zinc-950 bg-white hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
