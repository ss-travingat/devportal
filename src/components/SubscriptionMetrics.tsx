'use client';

import React from 'react';
import { Subscription } from '@/types/subscription';
import { CreditCard, CalendarClock, TrendingUp, Layers, AlertTriangle } from 'lucide-react';
import { estimatedMonthlyUSD } from '@/lib/spend';

interface SubscriptionMetricsProps {
  subscriptions: Subscription[];
  currency: 'USD' | 'INR';
  usdToInr: number | null;
}

// Needs a live rate to aggregate across currencies — USD-only subs are fine without it
function canComputeTotal(paidSubs: Subscription[], currency: 'USD' | 'INR', usdToInr: number | null): boolean {
  if (currency === 'USD') return true; // USD subs don't need conversion
  if (usdToInr === null) return false; // INR display needs the rate
  return true;
}

function fmtUSD(usdAmount: number): string {
  return '$' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtINR(usdAmount: number, usdToInr: number): string {
  const inr = usdAmount * usdToInr;
  return '₹' + inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTotal(usdAmount: number, currency: 'USD' | 'INR', usdToInr: number): string {
  return currency === 'INR' ? fmtINR(usdAmount, usdToInr) : fmtUSD(usdAmount);
}

export default function SubscriptionMetrics({ subscriptions, currency, usdToInr }: SubscriptionMetricsProps) {
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  const freeSubs = activeSubs.filter((s) => Boolean(s.isFree || s.billingFrequency === 'Free' || Number(s.amount) === 0));
  const paidSubs = activeSubs.filter((s) => !Boolean(s.isFree || s.billingFrequency === 'Free' || Number(s.amount) === 0));

  const computedMonthlyUSD = estimatedMonthlyUSD(subscriptions, usdToInr);
  const rateAvailable = canComputeTotal(paidSubs, currency, usdToInr) && computedMonthlyUSD !== null;
  const monthlyUSD = computedMonthlyUSD ?? 0;

  const annualUSD = monthlyUSD * 12;

  // Subtext shown under monthly/annual cards
  const rateSubtext = currency === 'INR' && usdToInr !== null
    ? `1 USD = ₹${usdToInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Active Services</span>
          <Layers className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-semibold text-white mt-2">{activeSubs.length}</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          {paidSubs.length} Paid • {freeSubs.length} Free Tier
        </p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Est. Monthly Spend</span>
          <CreditCard className="w-4 h-4 text-zinc-500" />
        </div>
        {rateAvailable ? (
          <>
            <p className="text-2xl font-semibold text-white mt-2">
              {formatTotal(monthlyUSD, currency, usdToInr as number)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {rateSubtext ?? 'Normalized across billing intervals'}
            </p>
          </>
        ) : (
          <div className="mt-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Rate unavailable</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">See individual amounts below</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Annual Run Rate</span>
          <TrendingUp className="w-4 h-4 text-zinc-500" />
        </div>
        {rateAvailable ? (
          <>
            <p className="text-2xl font-semibold text-white mt-2">
              {formatTotal(annualUSD, currency, usdToInr as number)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {rateSubtext ?? 'Projected annual expenditure'}
            </p>
          </>
        ) : (
          <div className="mt-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Rate unavailable</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Cannot convert to INR</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Business Timezone</span>
          <CalendarClock className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-base font-semibold text-white mt-3">IST — UTC+5:30</p>
        <p className="text-[11px] text-zinc-500 mt-1">India Standard Time</p>
      </div>
    </div>
  );
}

