'use client';

import React from 'react';
import { Subscription } from '@/types/subscription';
import { CreditCard, CalendarClock, TrendingUp, Layers } from 'lucide-react';

interface SubscriptionMetricsProps {
  subscriptions: Subscription[];
  currency: 'USD' | 'INR';
  usdToInr: number;
}

function toUSD(amount: number, subCurrency: string, usdToInr: number): number {
  if (subCurrency === 'INR') return amount / usdToInr;
  return amount; // assume USD for anything else
}

function formatAmount(usdAmount: number, currency: 'USD' | 'INR', usdToInr: number): string {
  if (currency === 'INR') {
    const inr = usdAmount * usdToInr;
    return '₹' + inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubscriptionMetrics({ subscriptions, currency, usdToInr }: SubscriptionMetricsProps) {
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  const freeSubs = activeSubs.filter((s) => Boolean(s.isFree || s.billingFrequency === 'Free' || Number(s.amount) === 0));
  const paidSubs = activeSubs.filter((s) => !Boolean(s.isFree || s.billingFrequency === 'Free' || Number(s.amount) === 0));

  // Normalize all paid subscriptions to monthly USD
  const monthlyUSD = paidSubs.reduce((acc, sub) => {
    const raw = parseFloat(sub.amount) || 0;
    const usd = toUSD(raw, sub.currency, usdToInr);
    switch (sub.billingFrequency) {
      case 'Monthly':     return acc + usd;
      case 'Quarterly':   return acc + usd / 3;
      case 'Yearly':      return acc + usd / 12;
      case 'Weekly':      return acc + usd * 4.33;
      case 'One-time':
      case 'Free':        return acc;
      default:            return acc + usd;
    }
  }, 0);

  const annualUSD = monthlyUSD * 12;

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
        <p className="text-2xl font-semibold text-white mt-2">
          {formatAmount(monthlyUSD, currency, usdToInr)}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">Normalized across billing intervals</p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Annual Run Rate</span>
          <TrendingUp className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-semibold text-white mt-2">
          {formatAmount(annualUSD, currency, usdToInr)}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">Projected annual expenditure</p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Business Timezone</span>
          <CalendarClock className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-base font-semibold text-white mt-3">UTC (Default)</p>
        <p className="text-[11px] text-zinc-500 mt-1">Billing dates aligned to standard</p>
      </div>
    </div>
  );
}

