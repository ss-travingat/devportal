'use client';

import React from 'react';
import { Subscription } from '@/types/subscription';
import { CreditCard, CalendarClock, TrendingUp, Layers } from 'lucide-react';

interface SubscriptionMetricsProps {
  subscriptions: Subscription[];
}

export default function SubscriptionMetrics({ subscriptions }: SubscriptionMetricsProps) {
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');

  // Compute monthly normalized expenditure
  const monthlyTotal = activeSubs.reduce((acc, sub) => {
    const amt = parseFloat(sub.amount) || 0;
    switch (sub.billingFrequency) {
      case 'Monthly':
        return acc + amt;
      case 'Quarterly':
        return acc + amt / 3;
      case 'Yearly':
        return acc + amt / 12;
      case 'Weekly':
        return acc + amt * 4.33;
      case 'One-time':
        return acc;
      default:
        return acc + amt;
    }
  }, 0);

  const annualTotal = monthlyTotal * 12;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Active Services</span>
          <Layers className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-semibold text-white mt-2">{activeSubs.length}</p>
        <p className="text-[11px] text-zinc-500 mt-1">{subscriptions.length} total tracked services</p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Est. Monthly Spend</span>
          <CreditCard className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-semibold text-white mt-2">
          ${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">Normalized across billing intervals</p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Annual Run Rate</span>
          <TrendingUp className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-semibold text-white mt-2">
          ${annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

