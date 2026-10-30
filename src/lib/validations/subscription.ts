import { z } from 'zod';

export const subscriptionSchema = z
  .object({
    purpose: z
      .string()
      .trim()
      .min(1, 'Purpose is required (e.g. Hosting, Monitoring, or Database).'),
    name: z.string().optional(),
    vendor: z
      .string()
      .trim()
      .min(1, 'Vendor / provider name is required.'),
    amount: z
      .string()
      .trim()
      .min(1, 'Amount is required.')
      .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0 && /^\d+(\.\d{1,4})?$/.test(val);
      }, 'Amount must be a valid positive decimal number (≥ 0).'),
    currency: z
      .string()
      .trim()
      .min(3, 'Currency must be a valid 3-letter ISO code (e.g. USD).')
      .max(3, 'Currency must be a valid 3-letter ISO code (e.g. USD).'),
    billingFrequency: z.enum([
      'Monthly',
      'Quarterly',
      'Yearly',
      'Weekly',
      'One-time',
      'Custom',
    ] as const),
    nextBillingDate: z
      .string()
      .min(1, 'Next billing date is required in configured business timezone.'),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    owner: z.string().optional().or(z.literal('')),
    ownerMobile: z.string().optional().or(z.literal('')),
    ownerEmail: z
      .string()
      .email('Please enter a valid email address.')
      .optional()
      .or(z.literal('')),
    notificationRecipients: z.string().optional().or(z.literal('')),
    vendorUrl: z
      .string()
      .url('Please enter a valid URL (e.g. https://dashboard.vendor.com).')
      .refine(
        (url) => url.startsWith('https://'),
        'Vendor URL must start with https://'
      )
      .optional()
      .or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    status: z.enum([
      'Active',
      'Cancelled',
      'Paused',
      'Trial',
      'Pending Review',
    ] as const),
  })
  .superRefine((data, ctx) => {
    // End / cancellation date: Required when applicable to a cancelled subscription
    if (data.status === 'Cancelled' && (!data.endDate || data.endDate.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End / cancellation date is required when status is Cancelled.',
        path: ['endDate'],
      });
    }
  });

export type SubscriptionSchemaType = z.infer<typeof subscriptionSchema>;
