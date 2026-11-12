import { Subscription } from '@/types/subscription';

export function isFreeSubscription(s: Subscription): boolean {
  return Boolean(s.isFree || s.billingFrequency === 'Free' || Number(s.amount) === 0);
}

/** Active subscriptions that actually cost money. */
export function paidActiveSubscriptions(subs: Subscription[]): Subscription[] {
  return subs.filter((s) => s.status === 'Active' && !isFreeSubscription(s));
}

function toUSD(amount: number, currency: string, usdToInr: number | null): number | null {
  if (currency === 'USD') return amount;
  if (currency === 'INR') return usdToInr ? amount / usdToInr : null;
  return null; // unknown currency: cannot convert honestly
}

function monthlyFactor(freq: Subscription['billingFrequency']): number {
  switch (freq) {
    case 'Monthly': return 1;
    case 'Quarterly': return 1 / 3;
    case 'Yearly': return 1 / 12;
    case 'Weekly': return 4.33;
    case 'One-time':
    case 'Free': return 0;
    default: return 1;
  }
}

/**
 * Estimated monthly spend in USD across active paid subscriptions.
 * Returns null when it cannot be computed truthfully (a needed FX rate or
 * currency is unavailable), so callers can show "—" instead of a wrong number.
 */
export function estimatedMonthlyUSD(subs: Subscription[], usdToInr: number | null): number | null {
  let total = 0;
  for (const s of paidActiveSubscriptions(subs)) {
    const usd = toUSD(parseFloat(s.amount) || 0, s.currency, usdToInr);
    if (usd === null) return null;
    total += usd * monthlyFactor(s.billingFrequency);
  }
  return total;
}
