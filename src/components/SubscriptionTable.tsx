'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Edit2, Trash2, Eye, ExternalLink, Calendar, Plus } from 'lucide-react';
import { Subscription } from '@/types/subscription';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onAddNew: () => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onView: (subscription: Subscription) => void;
}

function statusClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    case 'Cancelled':
      return 'border-red-500/30 bg-red-500/10 text-red-400';
    case 'Trial':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    default:
      return 'border-zinc-700 bg-zinc-800 text-white/60';
  }
}

export default function SubscriptionTable({
  subscriptions,
  onAddNew,
  onEdit,
  onDelete,
  onView,
}: SubscriptionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (tierFilter !== 'ALL' ? 1 : 0);

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const purposeText = (sub.purpose || sub.name || '').toLowerCase();
      const vendorText = sub.vendor.toLowerCase();
      const ownerText = (sub.owner || '').toLowerCase();
      const mobileText = (sub.ownerMobile || '').toLowerCase();
      const emailText = (sub.ownerEmail || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchSearch =
        purposeText.includes(query) ||
        vendorText.includes(query) ||
        ownerText.includes(query) ||
        mobileText.includes(query) ||
        emailText.includes(query);

      const matchStatus = statusFilter === 'ALL' || sub.status === statusFilter;
      const isFree = Boolean(sub.isFree || sub.billingFrequency === 'Free' || Number(sub.amount) === 0);
      const matchTier =
        tierFilter === 'ALL' ||
        (tierFilter === 'PAID' && !isFree) ||
        (tierFilter === 'FREE' && isFree);

      return matchSearch && matchStatus && matchTier;
    });
  }, [subscriptions, searchQuery, statusFilter, tierFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar. On phones the dropdowns collapse behind a filter icon. */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search purpose, vendor, owner, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-label="Filters"
            aria-expanded={filtersOpen}
            aria-controls="subscription-filters"
            className={`sm:hidden relative shrink-0 p-2.5 rounded-md border transition-colors cursor-pointer ${
              filtersOpen
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-white text-zinc-950 text-[10px] font-semibold leading-4 text-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div
          id="subscription-filters"
          className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 sm:justify-end`}
        >
          <Filter className="hidden sm:block w-3.5 h-3.5 text-zinc-500" />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="min-w-0 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-2 sm:py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
            aria-label="Filter by pricing tier"
          >
            <option value="ALL">All Pricing</option>
            <option value="PAID">Paid Only</option>
            <option value="FREE">Free Tier Only</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-0 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 sm:py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
            aria-label="Filter by subscription status"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Paused">Paused</option>
            <option value="Trial">Trial</option>
            <option value="Pending Review">Pending Review</option>
          </select>

          {/* On phones the page header already has "Add Subscription" */}
          <button
            onClick={onAddNew}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Service
          </button>
        </div>
      </div>

      {/* Mobile: one card per service (the 8-column table doesn't fit a phone) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-white/30 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <p className="text-[13px]">No services found.</p>
            <p className="text-[11px] mt-1 text-white/20">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isFree = item.isFree || item.billingFrequency === 'Free' || Number(item.amount) === 0;
            const responsible = item.responsiblePerson || item.owner;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onView(item)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onView(item);
                  }
                }}
                className="border border-zinc-800 rounded-lg bg-zinc-900/50 active:bg-zinc-800/40 p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-white text-[14px] break-words">{item.vendor}</div>
                    <div className="text-white/40 text-[12px] mt-0.5 flex items-start gap-1.5">
                      <span className="break-words min-w-0">{item.purpose || item.name}</span>
                      {item.vendorUrl && (
                        <a
                          href={item.vendorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-white/70 shrink-0 mt-0.5"
                          aria-label={`Open ${item.vendor}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 text-[10px] font-semibold border rounded ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/30">Plan</dt>
                    <dd className="mt-0.5 text-white/70">{item.plan || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/30">Amount</dt>
                    <dd className="mt-0.5 font-mono">
                      {isFree ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Free
                        </span>
                      ) : (
                        <span className="text-white">{item.currency} {Number(item.amount).toFixed(2)}</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/30">Next billing</dt>
                    <dd className="mt-0.5 text-white/70 flex items-center gap-1.5">
                      {item.nextBillingDate ? (
                        <>
                          <Calendar className="w-3 h-3 text-white/30 shrink-0" />
                          <span>{item.nextBillingDate}</span>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/30">Auto-renewal</dt>
                    <dd className="mt-0.5 text-white/70">{item.autoRenewal || (isFree ? 'N/A' : '—')}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[10px] uppercase tracking-wider text-white/30">Responsible</dt>
                    <dd className="mt-0.5 text-white/70 break-words">{responsible || '—'}</dd>
                  </div>
                </dl>

                <div
                  className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onView(item)}
                    className="p-2 text-white/40 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                    aria-label="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-white/40 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                    aria-label="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${item.vendor}"?`)) onDelete(item.id);
                    }}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto border border-zinc-800 rounded-lg bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/90 border-b border-zinc-800 text-white/30 uppercase tracking-wider font-semibold text-[10px]">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Next Billing</th>
              <th className="px-4 py-3">Auto-renewal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Responsible</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-white/30">
                  <p className="text-[13px]">No services found.</p>
                  <p className="text-[11px] mt-1 text-white/20">
                    Try adjusting your filters or click &ldquo;Add Service&rdquo; to create one.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isFree = item.isFree || item.billingFrequency === 'Free' || Number(item.amount) === 0;
                return (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  onClick={() => onView(item)}
                >
                  {/* Service */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-white text-[13px]">{item.vendor}</div>
                    <div className="text-white/40 text-[11px] mt-0.5 flex items-center gap-1.5">
                      <span>{item.purpose || item.name}</span>
                      {item.vendorUrl && (
                        <a
                          href={item.vendorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-white/70"
                        >
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5 text-[12px] text-white/60">
                    {item.plan || <span className="text-white/20 italic text-[11px]">—</span>}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 font-mono text-[12px]">
                    {isFree ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Free
                      </span>
                    ) : (
                      <span className="text-white">{item.currency} {Number(item.amount).toFixed(2)}</span>
                    )}
                  </td>

                  {/* Next Billing */}
                  <td className="px-4 py-3.5 text-[12px] text-white/60">
                    {item.nextBillingDate ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-white/30" />
                        <span>{item.nextBillingDate}</span>
                      </div>
                    ) : (
                      <span className="text-white/20 italic text-[11px]">N/A</span>
                    )}
                  </td>

                  {/* Auto-renewal */}
                  <td className="px-4 py-3.5 text-[12px] text-white/60">
                    {item.autoRenewal || (isFree ? 'N/A' : '—')}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold border rounded ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Responsible */}
                  <td className="px-4 py-3.5 text-[12px] text-white/60">
                    {item.responsiblePerson || item.owner || <span className="text-white/20 italic text-[11px]">—</span>}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onView(item)}
                        className="p-1 text-white/30 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-white/30 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.vendor}"?`)) onDelete(item.id);
                        }}
                        className="p-1 text-white/30 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary caption */}
      <div className="flex items-center justify-between text-[11px] text-white/30 px-1">
        <span>Showing {filtered.length} of {subscriptions.length} services</span>
      </div>
    </div>
  );
}
