'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, DollarSign, ShieldAlert, Phone, Mail } from 'lucide-react';
import { Subscription, SubscriptionFormData, BillingFrequency, SubscriptionStatus } from '@/types/subscription';
import { subscriptionSchema } from '@/lib/validations/subscription';

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubscriptionFormData, editId?: string) => Promise<void> | void;
  subscriptionToEdit?: Subscription | null;
}

const FREQUENCY_OPTIONS: BillingFrequency[] = [
  'Monthly',
  'Quarterly',
  'Yearly',
  'Weekly',
  'One-time',
  'Custom',
];

const STATUS_OPTIONS: SubscriptionStatus[] = [
  'Active',
  'Cancelled',
  'Paused',
  'Trial',
  'Pending Review',
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF', 'SGD'];

// Context tooltip that appears only after hovering for more than 3 seconds
function DelayedHoverContext({
  context,
  children,
}: {
  context: string;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 3000); // 3 seconds hover delay
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className="absolute z-50 top-full left-0 mt-1 px-3 py-1.5 bg-zinc-800/95 backdrop-blur-md border border-zinc-700 rounded-md shadow-2xl text-xs text-zinc-100 max-w-sm pointer-events-none flex items-center gap-2 animate-in fade-in duration-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
          <span>{context}</span>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionFormModal({
  isOpen,
  onClose,
  onSave,
  subscriptionToEdit,
}: SubscriptionFormModalProps) {
  const [formData, setFormData] = useState<SubscriptionFormData>(() => {
    if (subscriptionToEdit) {
      return {
        purpose: subscriptionToEdit.purpose || subscriptionToEdit.name || '',
        name: subscriptionToEdit.purpose || subscriptionToEdit.name || '',
        vendor: subscriptionToEdit.vendor,
        amount: subscriptionToEdit.amount,
        currency: subscriptionToEdit.currency || 'USD',
        billingFrequency: subscriptionToEdit.billingFrequency || 'Monthly',
        nextBillingDate: subscriptionToEdit.nextBillingDate || '',
        startDate: subscriptionToEdit.startDate || '',
        endDate: subscriptionToEdit.endDate || '',
        owner: subscriptionToEdit.owner || '',
        ownerMobile: subscriptionToEdit.ownerMobile || '',
        ownerEmail: subscriptionToEdit.ownerEmail || '',
        notificationRecipients: subscriptionToEdit.notificationRecipients || '',
        vendorUrl: subscriptionToEdit.vendorUrl || '',
        notes: subscriptionToEdit.notes || '',
        status: subscriptionToEdit.status || 'Active',
      };
    }
    return {
      purpose: '',
      name: '',
      vendor: '',
      amount: '',
      currency: 'USD',
      billingFrequency: 'Monthly',
      nextBillingDate: '',
      startDate: '',
      endDate: '',
      owner: '',
      ownerMobile: '',
      ownerEmail: '',
      notificationRecipients: '',
      vendorUrl: '',
      notes: '',
      status: 'Active',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configuredTimezone = 'UTC (Business Default)';

  if (!isOpen) return null;

  const validate = (): boolean => {
    const result = subscriptionSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0]?.toString() || 'form';
        if (!newErrors[fieldName]) {
          newErrors[fieldName] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const num = Number(formData.amount);
    const normalizedData: SubscriptionFormData = {
      ...formData,
      amount: isNaN(num) ? formData.amount : num.toFixed(2),
      purpose: formData.purpose.trim(),
      name: formData.purpose.trim(),
      vendor: formData.vendor.trim(),
      vendorUrl: formData.vendorUrl?.trim() || undefined,
      owner: formData.owner?.trim() || undefined,
      ownerMobile: formData.ownerMobile?.trim() || undefined,
      ownerEmail: formData.ownerEmail?.trim() || undefined,
      notificationRecipients: formData.notificationRecipients?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSave(normalizedData, subscriptionToEdit?.id);
      onClose();
    } catch (err) {
      console.error('Error saving subscription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {subscriptionToEdit ? 'Edit Subscription Record' : 'Create Subscription Record'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Service Payments Management • Configured Timezone: {configuredTimezone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Section 1: Core Service Info */}
          <div>
            <h3 className="text-xs uppercase font-medium tracking-wider text-zinc-400 mb-3">
              1. Service Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Purpose */}
              <DelayedHoverContext context="Human-readable label defining the service purpose.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Purpose <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hosting, APM Monitoring, or Database"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className={`w-full px-3 py-2 bg-zinc-950 border ${
                      errors.purpose ? 'border-zinc-400' : 'border-zinc-800'
                    } rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                  />
                  {errors.purpose && <p className="text-xs text-zinc-300 mt-1">{errors.purpose}</p>}
                </div>
              </DelayedHoverContext>

              {/* Vendor / provider */}
              <DelayedHoverContext context="Provider or company name.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Vendor / Provider <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Company or service name, e.g. AWS"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className={`w-full px-3 py-2 bg-zinc-950 border ${
                      errors.vendor ? 'border-zinc-400' : 'border-zinc-800'
                    } rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                  />
                  {errors.vendor && <p className="text-xs text-zinc-300 mt-1">{errors.vendor}</p>}
                </div>
              </DelayedHoverContext>
            </div>
          </div>

          {/* Section 2: Financial & Schedule */}
          <div className="pt-2 border-t border-zinc-800">
            <h3 className="text-xs uppercase font-medium tracking-wider text-zinc-400 mb-3">
              2. Billing & Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Amount */}
              <DelayedHoverContext context="Decimal value (≥ 0).">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Amount <span className="text-zinc-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 bg-zinc-950 border ${
                        errors.amount ? 'border-zinc-400' : 'border-zinc-800'
                      } rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-zinc-300 mt-1">{errors.amount}</p>}
                </div>
              </DelayedHoverContext>

              {/* Currency */}
              <DelayedHoverContext context="Explicit ISO currency code.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Currency (ISO 4217) <span className="text-zinc-400">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  >
                    {CURRENCY_OPTIONS.map((cur) => (
                      <option key={cur} value={cur} className="bg-zinc-900 text-white">
                        {cur}
                      </option>
                    ))}
                  </select>
                  {errors.currency && <p className="text-xs text-zinc-300 mt-1">{errors.currency}</p>}
                </div>
              </DelayedHoverContext>

              {/* Billing frequency */}
              <DelayedHoverContext context="Payment interval cycle.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Billing Frequency <span className="text-zinc-400">*</span>
                  </label>
                  <select
                    value={formData.billingFrequency}
                    onChange={(e) =>
                      setFormData({ ...formData, billingFrequency: e.target.value as BillingFrequency })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  >
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <option key={freq} value={freq} className="bg-zinc-900 text-white">
                        {freq}
                      </option>
                    ))}
                  </select>
                  {errors.billingFrequency && (
                    <p className="text-xs text-zinc-300 mt-1">{errors.billingFrequency}</p>
                  )}
                </div>
              </DelayedHoverContext>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {/* Next billing date */}
              <DelayedHoverContext context={`In configured timezone (${configuredTimezone}).`}>
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Next Billing Date <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.nextBillingDate}
                    onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                    className={`w-full px-3 py-2 bg-zinc-950 border ${
                      errors.nextBillingDate ? 'border-zinc-400' : 'border-zinc-800'
                    } rounded-md text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                  />
                  {errors.nextBillingDate && (
                    <p className="text-xs text-zinc-300 mt-1">{errors.nextBillingDate}</p>
                  )}
                </div>
              </DelayedHoverContext>

              {/* Start date */}
              <DelayedHoverContext context="Date subscription began.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Start Date <span className="text-zinc-500 text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
              </DelayedHoverContext>

              {/* End / cancellation date */}
              <DelayedHoverContext context="Cancellation expiration date.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    End / Cancellation Date{' '}
                    {formData.status === 'Cancelled' ? (
                      <span className="text-zinc-400">* (Required for Cancelled)</span>
                    ) : (
                      <span className="text-zinc-500 text-[11px] font-normal">(Optional)</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-3 py-2 bg-zinc-950 border ${
                      errors.endDate ? 'border-zinc-400' : 'border-zinc-800'
                    } rounded-md text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                  />
                  {errors.endDate && <p className="text-xs text-zinc-300 mt-1">{errors.endDate}</p>}
                </div>
              </DelayedHoverContext>
            </div>
          </div>

          {/* Section 3: Status, Ownership & Governance */}
          <div className="pt-2 border-t border-zinc-800">
            <h3 className="text-xs uppercase font-medium tracking-wider text-zinc-400 mb-3">
              3. Status & Ownership
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <DelayedHoverContext context="Active by default; allowed: Active, Cancelled, Paused, Trial, Pending Review.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Status <span className="text-zinc-400">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as SubscriptionStatus })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st} className="bg-zinc-900 text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </DelayedHoverContext>

              {/* Owner */}
              <DelayedHoverContext context="User or team responsible for reviewing bill.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Owner <span className="text-zinc-400 text-[11px] font-normal">(Recommended)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DevOps Team or Jane Doe"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
              </DelayedHoverContext>
            </div>

            {/* Ownership Contact: Mobile & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Owner Mobile */}
              <DelayedHoverContext context="Mobile contact number for responsible owner.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Owner Mobile <span className="text-zinc-400 text-[11px] font-normal">(Phone contact)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={formData.ownerMobile}
                      onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 bg-zinc-950 border ${
                        errors.ownerMobile ? 'border-zinc-400' : 'border-zinc-800'
                      } rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                    />
                  </div>
                  {errors.ownerMobile && <p className="text-xs text-zinc-300 mt-1">{errors.ownerMobile}</p>}
                </div>
              </DelayedHoverContext>

              {/* Owner Email */}
              <DelayedHoverContext context="Direct email address of responsible owner.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Owner Email <span className="text-zinc-500 text-[11px] font-normal">(Contact)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      placeholder="owner@company.com"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 bg-zinc-950 border ${
                        errors.ownerEmail ? 'border-zinc-400' : 'border-zinc-800'
                      } rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                    />
                  </div>
                  {errors.ownerEmail && <p className="text-xs text-zinc-300 mt-1">{errors.ownerEmail}</p>}
                </div>
              </DelayedHoverContext>
            </div>

            {/* Notification recipients & Vendor URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <DelayedHoverContext context="Defaults to configured team recipients if blank.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Notification Recipients{' '}
                    <span className="text-zinc-500 text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. devops-billing@company.com"
                    value={formData.notificationRecipients}
                    onChange={(e) => setFormData({ ...formData, notificationRecipients: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
              </DelayedHoverContext>

              <DelayedHoverContext context="HTTPS URL where service is managed.">
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Vendor URL <span className="text-zinc-500 text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://dashboard.vendor.com"
                    value={formData.vendorUrl}
                    onChange={(e) => setFormData({ ...formData, vendorUrl: e.target.value })}
                    className={`w-full px-3 py-2 bg-zinc-950 border ${
                      errors.vendorUrl ? 'border-zinc-400' : 'border-zinc-800'
                    } rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors`}
                  />
                  {errors.vendorUrl && <p className="text-xs text-zinc-300 mt-1">{errors.vendorUrl}</p>}
                </div>
              </DelayedHoverContext>
            </div>
          </div>

          {/* Section 4: Notes & Security Warning */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="block text-xs font-medium text-zinc-200 mb-1">
              Notes <span className="text-zinc-500 text-[11px] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter general context, plan details, or contract numbers..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
            />
            {/* Warning rule */}
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded text-xs text-zinc-300">
              <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>
                <strong>Warning:</strong> Plain text only. Do not enter passwords, API secrets, or credit card details.
              </span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : subscriptionToEdit
                ? 'Save Changes'
                : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
