'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, Calendar, Building, User, Mail, Phone, Edit2 } from 'lucide-react';
import { Subscription } from '@/types/subscription';

interface SubscriptionDetailModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (sub: Subscription) => void;
}

export default function SubscriptionDetailModal({
  subscription,
  isOpen,
  onClose,
  onEdit,
}: SubscriptionDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !subscription) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl text-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800 shrink-0 bg-zinc-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="detail-modal-title" className="text-xl font-semibold tracking-tight text-white">
                {subscription.purpose || subscription.name}
              </h2>
              <span className="px-2 py-0.5 text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-200 rounded">
                {subscription.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-zinc-500" />
              {subscription.vendor}
              {subscription.vendorUrl && (
                <a
                  href={subscription.vendorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-zinc-300 hover:text-white underline"
                >
                  Visit Portal <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Amount</p>
              <p className="text-base font-semibold text-white mt-1">
                {subscription.currency} {Number(subscription.amount).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Frequency</p>
              <p className="text-base font-semibold text-white mt-1">{subscription.billingFrequency}</p>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Next Billing</p>
              <p className="text-base font-semibold text-white mt-1">{subscription.nextBillingDate}</p>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Status</p>
              <p className="text-base font-semibold text-white mt-1">{subscription.status}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Schedule block */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Start Date:</span>
                <span className="text-white font-medium">{subscription.startDate || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>End / Cancel Date:</span>
                <span className="text-white font-medium">{subscription.endDate || 'N/A (Active)'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Recipients:</span>
                <span className="text-white font-medium">
                  {subscription.notificationRecipients || 'Default Team Recipients'}
                </span>
              </div>
            </div>

            {/* Ownership block */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Owner:</span>
                <span className="text-white font-medium">{subscription.owner || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>Owner Mobile:</span>
                <span className="text-white font-medium">
                  {subscription.ownerMobile || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Owner Email:</span>
                <span className="text-white font-medium">
                  {subscription.ownerEmail || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-xs uppercase font-medium tracking-wider text-zinc-400 mb-2">Notes</h4>
            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-300 leading-relaxed min-h-[60px]">
              {subscription.notes ? subscription.notes : <span className="italic text-zinc-600">No notes provided for this record.</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0 bg-zinc-900">
          <span className="text-[11px] text-zinc-500">ID: {subscription.id}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(subscription);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Record
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
