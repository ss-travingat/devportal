export type BillingFrequency =
  | 'Monthly'
  | 'Quarterly'
  | 'Yearly'
  | 'Weekly'
  | 'One-time'
  | 'Custom';

export type SubscriptionStatus =
  | 'Active'
  | 'Cancelled'
  | 'Paused'
  | 'Trial'
  | 'Pending Review';

export interface Subscription {
  id: string;
  purpose: string; // Purpose (Human-readable label, e.g. Hosting or Monitoring)
  name?: string; // Optional alias for backward compatibility
  vendor: string; // Vendor/provider (Company or service name)
  amount: string; // Decimal monetary value >= 0 (represented as exact decimal string, e.g. "49.99")
  currency: string; // ISO 4217 code (USD, EUR, GBP, etc.)
  billingFrequency: BillingFrequency;
  nextBillingDate: string; // YYYY-MM-DD in configured business timezone
  startDate?: string; // Date subscription began
  endDate?: string; // End / cancellation date (required if cancelled)
  owner?: string; // User/team responsible for reviewing bill
  ownerEmail?: string; // Owner Email address
  ownerMobile?: string; // Owner Mobile phone number
  notificationRecipients?: string; // Defaults to team if blank
  vendorUrl?: string; // HTTPS URL
  notes?: string; // Plain text warning against sensitive secrets
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionFormData = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;
