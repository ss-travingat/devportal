'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Edit2, Trash2, Eye, ExternalLink, Calendar, Plus, Phone, Mail } from 'lucide-react';
import { Subscription } from '@/types/subscription';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onAddNew: () => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onView: (subscription: Subscription) => void;
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

      return matchSearch && matchStatus;
    });
  }, [subscriptions, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search purpose, vendor, owner, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Paused">Paused</option>
              <option value="Trial">Trial</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>

          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Record
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-zinc-800 rounded-lg bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-medium text-[11px]">
            <tr>
              <th className="px-4 py-3">Purpose & Vendor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Frequency</th>
              <th className="px-4 py-3">Next Billing Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner & Contact</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  <p className="text-sm">No subscription records found.</p>
                  <p className="text-xs mt-1 text-zinc-600">
                    Try adjusting your search criteria or click &ldquo;Add Record&rdquo; to create a new one.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  onClick={() => onView(item)}
                >
                  {/* Purpose & Vendor */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-white">{item.purpose || item.name}</div>
                    <div className="text-zinc-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                      <span>{item.vendor}</span>
                      {item.vendorUrl && (
                        <a
                          href={item.vendorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-zinc-300"
                        >
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 font-mono text-zinc-100">
                    {item.currency} {Number(item.amount).toFixed(2)}
                  </td>

                  {/* Frequency */}
                  <td className="px-4 py-3.5 text-zinc-300">{item.billingFrequency}</td>

                  {/* Next Billing Date */}
                  <td className="px-4 py-3.5 text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.nextBillingDate}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-medium border border-zinc-700 bg-zinc-800 text-zinc-200 rounded">
                      {item.status}
                    </span>
                  </td>

                  {/* Owner & Contact info */}
                  <td className="px-4 py-3.5 text-zinc-300">
                    <div className="font-medium text-zinc-200">
                      {item.owner || <span className="text-zinc-600 italic">Unassigned</span>}
                    </div>
                    {item.ownerMobile && (
                      <div className="text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                        <span>{item.ownerMobile}</span>
                      </div>
                    )}
                    {item.ownerEmail && (
                      <div className="text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                        <span>{item.ownerEmail}</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onView(item)}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${item.purpose || item.name}"?`)) {
                            onDelete(item.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary caption */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span>
          Showing {filtered.length} of {subscriptions.length} records
        </span>
        <span>Configured Timezone: UTC</span>
      </div>
    </div>
  );
}
