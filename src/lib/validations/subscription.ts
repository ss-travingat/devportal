import { z } from 'zod';

export const subscriptionSchema = z
  .object({
    vendor: z.string().trim().min(1, 'Service name is required.'),
    purpose: z.string().trim().min(1, 'Purpose is required.'),
    name: z.string().optional(),
    plan: z.string().optional().or(z.literal('')),
    isFree: z.boolean().default(false).optional(),
    amount: z.string().optional().or(z.literal('')),
    currency: z.string().trim().min(3).max(3).default('USD'),
    billingFrequency: z.enum([
      'Monthly', 'Quarterly', 'Yearly', 'Weekly', 'One-time', 'Usage-based', 'Custom', 'Free',
    ] as const),
    nextBillingDate: z.string().optional().or(z.literal('')),
    autoRenewal: z.enum(['On', 'Off', 'N/A']).optional(),
    status: z.enum(['Active', 'Cancelled', 'Paused', 'Trial', 'Pending Review'] as const),
    ownerEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
    billingEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
    responsiblePerson: z.enum(['Ravi', 'Deva', 'Vishnu', '']).optional(),
    // Legacy fields
    owner: z.string().optional().or(z.literal('')),
    ownerMobile: z.string().optional().or(z.literal('')),
    notificationRecipients: z.string().optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    vendorUrl: z
      .string()
      .refine((v) => !v || v === '' || (v.startsWith('https://') && z.string().url().safeParse(v).success), {
        message: 'Dashboard URL must be a valid https:// URL.',
      })
      .optional()
      .or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (!data.isFree) {
      if (!data.amount || data.amount.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is required for paid services.', path: ['amount'] });
      } else {
        const num = Number(data.amount);
        if (isNaN(num) || num < 0 || !/^\d+(\.\d{1,4})?$/.test(data.amount.trim())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid positive amount.', path: ['amount'] });
        }
      }
      if (!data.nextBillingDate || data.nextBillingDate.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Next billing date is required for paid services.', path: ['nextBillingDate'] });
      }
    }
  });

export type SubscriptionSchemaType = z.infer<typeof subscriptionSchema>;
