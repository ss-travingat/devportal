import { Subscription } from '@/types/subscription';

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

const STORAGE_KEY = 'devportal_service_payments_v2';

export function loadSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return INITIAL_SUBSCRIPTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_SUBSCRIPTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        purpose: item.purpose || item.name || 'Untitled Service',
      }));
    }
    return INITIAL_SUBSCRIPTIONS;
  } catch {
    return INITIAL_SUBSCRIPTIONS;
  }
}

export function saveSubscriptions(subscriptions: Subscription[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (err) {
    console.error('Failed to save subscriptions to localStorage', err);
  }
}
