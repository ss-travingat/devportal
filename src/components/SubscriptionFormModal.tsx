'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldAlert, DollarSign } from 'lucide-react';
import { Subscription, SubscriptionFormData, BillingFrequency, SubscriptionStatus, AutoRenewal, ResponsiblePerson } from '@/types/subscription';
import { subscriptionSchema } from '@/lib/validations/subscription';

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubscriptionFormData, editId?: string) => Promise<void> | void;
  subscriptionToEdit?: Subscription | null;
}

const FREQUENCY_OPTIONS: BillingFrequency[] = ['Monthly', 'Yearly', 'Quarterly', 'Weekly', 'One-time', 'Usage-based', 'Custom', 'Free'];
const STATUS_OPTIONS: SubscriptionStatus[] = ['Active', 'Trial', 'Paused', 'Cancelled', 'Pending Review'];
const AUTO_RENEWAL_OPTIONS: AutoRenewal[] = ['On', 'Off', 'N/A'];
const RESPONSIBLE_OPTIONS: ResponsiblePerson[] = ['', 'Ravi', 'Deva', 'Vishnu'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'SGD'];

function emptyForm(): SubscriptionFormData {
  return {
    vendor: '', purpose: '', plan: '',
    isFree: false, amount: '', currency: 'USD',
    billingFrequency: 'Monthly', nextBillingDate: '',
    autoRenewal: 'On', status: 'Active',
    ownerEmail: '', billingEmail: '', responsiblePerson: '',
    vendorUrl: '', notes: '',
  };
}

function fromSubscription(s: Subscription): SubscriptionFormData {
  const isFree = Boolean(s.isFree || s.billingFrequency === 'Free' || s.amount === '0' || s.amount === '0.00');
  return {
    vendor: s.vendor || '',
    purpose: s.purpose || s.name || '',
    name: s.purpose || s.name || '',
    plan: s.plan || '',
    isFree,
    amount: isFree ? '0.00' : (s.amount || ''),
    currency: s.currency || 'USD',
    billingFrequency: s.billingFrequency || (isFree ? 'Free' : 'Monthly'),
    nextBillingDate: s.nextBillingDate || '',
    autoRenewal: s.autoRenewal || 'On',
    status: s.status || 'Active',
    ownerEmail: s.ownerEmail || '',
    billingEmail: s.billingEmail || '',
    responsiblePerson: (s.responsiblePerson || '') as ResponsiblePerson,
    vendorUrl: s.vendorUrl || '',
    notes: s.notes || '',
  };
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2 bg-zinc-950 border ${err ? 'border-red-500/60' : 'border-zinc-800'} rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 transition-colors`;

const selectCls = `w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 transition-colors`;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-[0.08em] mb-1.5">
      {children}{required && <span className="text-red-400/70 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-400 mt-1">{msg}</p>;
}

export default function SubscriptionFormModal({ isOpen, onClose, onSave, subscriptionToEdit }: SubscriptionFormModalProps) {
  const [form, setForm] = useState<SubscriptionFormData>(() =>
    subscriptionToEdit ? fromSubscription(subscriptionToEdit) : emptyForm()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(subscriptionToEdit ? fromSubscription(subscriptionToEdit) : emptyForm());
    setErrors({});
  }, [isOpen, subscriptionToEdit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onClose(); };
    if (isOpen) { window.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const set = (patch: Partial<SubscriptionFormData>) => setForm((prev) => ({ ...prev, ...patch }));

  const validate = () => {
    const result = subscriptionSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0]?.toString() || 'form';
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const isFree = Boolean(form.isFree);
    const num = Number(form.amount);
    const data: SubscriptionFormData = {
      ...form,
      isFree,
      amount: isFree ? '0.00' : (isNaN(num) ? form.amount : num.toFixed(2)),
      billingFrequency: isFree && form.billingFrequency === 'Monthly' ? 'Free' : form.billingFrequency,
      name: form.vendor,
      purpose: form.purpose.trim(),
      vendor: form.vendor.trim(),
    };
    try {
      setSubmitting(true);
      await onSave(data, subscriptionToEdit?.id);
      onClose();
    } catch (err) {
      console.error('Error saving subscription:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFree = (checked: boolean) => {
    set({
      isFree: checked,
      amount: checked ? '0.00' : (form.amount === '0.00' ? '' : form.amount),
      billingFrequency: checked ? 'Free' : (form.billingFrequency === 'Free' ? 'Monthly' : form.billingFrequency),
      nextBillingDate: checked ? '' : form.nextBillingDate,
      autoRenewal: checked ? 'N/A' : (form.autoRenewal === 'N/A' ? 'On' : form.autoRenewal),
    });
    if (checked) setErrors((prev) => { const c = { ...prev }; delete c.amount; delete c.nextBillingDate; return c; });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#111111] border border-zinc-800/80 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-white">
              {subscriptionToEdit ? 'Edit Service' : 'Add Service'}
            </h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              {subscriptionToEdit ? subscriptionToEdit.vendor : 'Fill in what you know — everything except service name and purpose is optional'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div ref={bodyRef} className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

            {/* Row 1: Service name + Purpose */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Service name</Label>
                <input
                  type="text"
                  placeholder="Cloudflare, GitHub, Claude…"
                  value={form.vendor}
                  onChange={(e) => set({ vendor: e.target.value })}
                  className={inputCls(errors.vendor)}
                  autoFocus
                />
                <FieldError msg={errors.vendor} />
              </div>
              <div>
                <Label required>Purpose</Label>
                <input
                  type="text"
                  placeholder="What we use it for"
                  value={form.purpose}
                  onChange={(e) => set({ purpose: e.target.value })}
                  className={inputCls(errors.purpose)}
                />
                <FieldError msg={errors.purpose} />
              </div>
            </div>

            {/* Row 2: Plan + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan</Label>
                <input
                  type="text"
                  placeholder="Free, Pro, or the actual plan name"
                  value={form.plan || ''}
                  onChange={(e) => set({ plan: e.target.value })}
                  className={inputCls()}
                />
              </div>
              <div>
                <Label required>Status</Label>
                <select value={form.status} onChange={(e) => set({ status: e.target.value as SubscriptionStatus })} className={selectCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                </select>
              </div>
            </div>

            {/* Free service toggle */}
            <label className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.isFree)}
                onChange={(e) => toggleFree(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-[13px] font-medium text-white">Free service / free tier</span>
                <span className="block text-[11px] text-white/40">No billing — zeros out amount and sets auto-renewal to N/A</span>
              </div>
              {form.isFree && (
                <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  $0.00
                </span>
              )}
            </label>

            {/* Row 3: Amount + Currency + Billing frequency */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label required={!form.isFree}>Amount</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={form.isFree ? '0.00' : 'Amount'}
                    value={form.isFree ? '0.00' : form.amount}
                    disabled={Boolean(form.isFree)}
                    onChange={(e) => set({ amount: e.target.value })}
                    className={`${inputCls(errors.amount)} pl-9 ${form.isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <FieldError msg={errors.amount} />
              </div>
              <div>
                <Label required>Currency</Label>
                <select value={form.currency} onChange={(e) => set({ currency: e.target.value })} className={selectCls}>
                  {CURRENCY_OPTIONS.map((c) => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                </select>
              </div>
              <div>
                <Label required>Billing frequency</Label>
                <select value={form.billingFrequency} onChange={(e) => set({ billingFrequency: e.target.value as BillingFrequency })} className={selectCls}>
                  {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Next billing date + Auto-renewal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required={!form.isFree}>Next billing / renewal date</Label>
                <input
                  type="date"
                  value={form.nextBillingDate || ''}
                  onChange={(e) => set({ nextBillingDate: e.target.value })}
                  className={inputCls(errors.nextBillingDate)}
                />
                <FieldError msg={errors.nextBillingDate} />
              </div>
              <div>
                <Label>Auto-renewal</Label>
                <select value={form.autoRenewal || 'On'} onChange={(e) => set({ autoRenewal: e.target.value as AutoRenewal })} className={selectCls}>
                  {AUTO_RENEWAL_OPTIONS.map((a) => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
                </select>
              </div>
            </div>

            {/* Row 5: Account email + Billing email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account / owner email</Label>
                <input
                  type="email"
                  placeholder="Travingat email that owns the account"
                  value={form.ownerEmail || ''}
                  onChange={(e) => set({ ownerEmail: e.target.value })}
                  className={inputCls(errors.ownerEmail)}
                />
                <FieldError msg={errors.ownerEmail} />
              </div>
              <div>
                <Label>Billing email</Label>
                <input
                  type="email"
                  placeholder="Email receiving invoices"
                  value={form.billingEmail || ''}
                  onChange={(e) => set({ billingEmail: e.target.value })}
                  className={inputCls(errors.billingEmail)}
                />
                <FieldError msg={errors.billingEmail} />
              </div>
            </div>

            {/* Row 6: Responsible person + Dashboard URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsible person</Label>
                <select value={form.responsiblePerson || ''} onChange={(e) => set({ responsiblePerson: e.target.value as ResponsiblePerson })} className={selectCls}>
                  {RESPONSIBLE_OPTIONS.map((p) => (
                    <option key={p} value={p} className="bg-zinc-900">{p || '— Select person —'}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Dashboard URL</Label>
                <input
                  type="url"
                  placeholder="https://dashboard.vendor.com"
                  value={form.vendorUrl || ''}
                  onChange={(e) => set({ vendorUrl: e.target.value })}
                  className={inputCls(errors.vendorUrl)}
                />
                <FieldError msg={errors.vendorUrl} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <textarea
                rows={3}
                placeholder="Pending account transfer, limits, or other details…"
                value={form.notes || ''}
                onChange={(e) => set({ notes: e.target.value })}
                className={inputCls()}
              />
            </div>

            {/* Security warning */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[11px] text-amber-200/80">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Plain text only — do not enter passwords, API keys, or card numbers.</span>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/60 bg-[#111111] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-[13px] font-medium text-white/60 bg-zinc-800/60 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-[13px] font-semibold text-zinc-950 bg-white hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : subscriptionToEdit ? 'Save changes' : 'Add service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
