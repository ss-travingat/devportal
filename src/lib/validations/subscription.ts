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
    isFree: z.boolean().default(false).optional(),
    amount: z.string().optional().or(z.literal('')),
    currency: z
      .string()
      .trim()
      .min(3, 'Currency must be a valid 3-letter ISO code (e.g. USD).')
      .max(3, 'Currency must be a valid 3-letter ISO code (e.g. USD).')
      .default('USD'),
    billingFrequency: z.enum([
      'Monthly',
      'Quarterly',
      'Yearly',
      'Weekly',
      'One-time',
      'Custom',
      'Free',
    ] as const),
    nextBillingDate: z.string().optional().or(z.literal('')),
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
    const isFree = Boolean(data.isFree);

    // If paid, amount and nextBillingDate are strictly required
    if (!isFree) {
      if (!data.amount || data.amount.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount is required for paid services.',
          path: ['amount'],
        });
      } else {
        const num = Number(data.amount);
        if (isNaN(num) || num < 0 || !/^\d+(\.\d{1,4})?$/.test(data.amount.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Amount must be a valid positive decimal number (≥ 0).',
            path: ['amount'],
          });
        }
      }

      if (!data.nextBillingDate || data.nextBillingDate.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Next billing date is required in configured business timezone.',
          path: ['nextBillingDate'],
        });
      }
    }

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
