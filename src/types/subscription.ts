export type BillingFrequency =
  | 'Monthly'
  | 'Quarterly'
  | 'Yearly'
  | 'Weekly'
  | 'One-time'
  | 'Usage-based'
  | 'Custom'
  | 'Free';

export type SubscriptionStatus =
  | 'Active'
  | 'Cancelled'
  | 'Paused'
  | 'Trial'
  | 'Pending Review';

export type AutoRenewal = 'On' | 'Off' | 'N/A';

export type ResponsiblePerson = 'Ravi' | 'Deva' | 'Vishnu' | '';

export interface Subscription {
  id: string;
  vendor: string;        // Service name (Cloudflare, GitHub, etc.)
  purpose: string;       // What we use it for
  name?: string;         // Backward-compat alias for purpose
  plan?: string;         // Free, Pro, or actual plan name
  isFree?: boolean;
  amount: string;        // Decimal string, "0.00" for free
  currency: string;      // ISO 4217
  billingFrequency: BillingFrequency;
  nextBillingDate?: string;  // YYYY-MM-DD
  autoRenewal?: AutoRenewal;
  status: SubscriptionStatus;
  ownerEmail?: string;   // Travingat email that owns the account
  billingEmail?: string; // Email receiving invoices
  responsiblePerson?: ResponsiblePerson; // Ravi, Deva, or Vishnu
  // Legacy fields — kept for backward compat with stored data
  owner?: string;
  ownerMobile?: string;
  notificationRecipients?: string;
  startDate?: string;
  endDate?: string;
  vendorUrl?: string;    // Dashboard URL
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionFormData = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;
