'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Subscription, SubscriptionFormData } from '@/types/subscription';
import { saveSubscriptions } from '@/lib/storage';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionFormModal from '@/components/SubscriptionFormModal';
import SubscriptionDetailModal from '@/components/SubscriptionDetailModal';
import SubscriptionMetrics from '@/components/SubscriptionMetrics';

export default function ServicePaymentsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscription modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  const [detailSubscription, setDetailSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch subscriptions from backend on mount (asynchronous only to prevent cascading renders)
  useEffect(() => {
    let isMounted = true;

    async function loadSubscriptions() {
      try {
        const res = await fetch('/api/subscriptions');
        if (!res.ok) {
          throw new Error(`Failed to load subscriptions (${res.status})`);
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setSubscriptions(data);
          saveSubscriptions(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load subscriptions:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSubscriptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateOrUpdate = async (data: SubscriptionFormData, editId?: string) => {
    setErrorMessage(null);
    if (editId) {
      try {
        const res = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...data }),
        });
        const resData = await res.json();
        if (res.ok && resData.subscription) {
          const updated = subscriptions.map((s) => (s.id === editId ? resData.subscription : s));
          setSubscriptions(updated);
          saveSubscriptions(updated);
          return;
        } else if (!res.ok && resData.errors) {
          const firstErr = Object.values(resData.errors)[0];
          throw new Error(String(firstErr) || resData.message || 'Failed to update record');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'API update failed';
        console.error('API update failed:', err);
        setErrorMessage(msg);
        throw err;
      }
    } else {
      try {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (res.ok && resData.subscription) {
          const updated = [resData.subscription, ...subscriptions];
          setSubscriptions(updated);
          saveSubscriptions(updated);
          return;
        } else if (!res.ok && resData.errors) {
          const firstErr = Object.values(resData.errors)[0];
          throw new Error(String(firstErr) || resData.message || 'Failed to create record');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'API create failed';
        console.error('API create failed:', err);
        setErrorMessage(msg);
        throw err;
      }
    }
  };

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete subscription');
      }
      const updated = subscriptions.filter((s) => s.id !== id);
      setSubscriptions(updated);
      saveSubscriptions(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'API delete failed';
      console.error('API delete failed:', err);
      setErrorMessage(msg);
    }
  };

  const handleOpenEdit = (subscription: Subscription) => {
    setSubscriptionToEdit(subscription);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setSubscriptionToEdit(null);
    setIsFormOpen(true);
  };

  const handleViewDetails = (subscription: Subscription) => {
    setDetailSubscription(subscription);
    setIsDetailOpen(true);
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Service Payments
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track subscriptions, vendor renewal schedules, and ownership accountability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors shadow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-md flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <SubscriptionMetrics subscriptions={subscriptions} />

      {isLoading && subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-zinc-800 rounded-lg bg-zinc-900/40 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mb-2" />
          <p className="text-xs">Loading subscription records from backend...</p>
        </div>
      ) : (
        <SubscriptionTable
          subscriptions={subscriptions}
          onAddNew={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onView={handleViewDetails}
        />
      )}

      <SubscriptionFormModal
        key={isFormOpen ? (subscriptionToEdit?.id ?? 'create') : 'closed'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleCreateOrUpdate}
        subscriptionToEdit={subscriptionToEdit}
      />

      <SubscriptionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        subscription={detailSubscription}
        onEdit={(sub) => {
          setIsDetailOpen(false);
          handleOpenEdit(sub);
        }}
      />
    </div>
  );
}
