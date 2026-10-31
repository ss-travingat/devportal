'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Subscription, SubscriptionFormData } from '@/types/subscription';
import { loadSubscriptions, saveSubscriptions } from '@/lib/storage';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionFormModal from '@/components/SubscriptionFormModal';
import SubscriptionDetailModal from '@/components/SubscriptionDetailModal';
import SubscriptionMetrics from '@/components/SubscriptionMetrics';

export default function ServicePaymentsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions());

  // Subscription modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  const [detailSubscription, setDetailSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load subscriptions from JSON via API on mount
  useEffect(() => {
    fetch('/api/subscriptions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubscriptions(data);
          saveSubscriptions(data);
        }
      })
      .catch((err) => console.error('Failed to load from subscriptions.json:', err));
  }, []);

  const handleCreateOrUpdate = async (data: SubscriptionFormData, editId?: string) => {
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
        }
      } catch (err) {
        console.error('API update failed:', err);
      }
      // Fallback
      const timestamp = new Date().toISOString();
      const updated = subscriptions.map((sub) =>
        sub.id === editId ? { ...sub, ...data, updatedAt: timestamp } : sub
      );
      setSubscriptions(updated);
      saveSubscriptions(updated);
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
        }
      } catch (err) {
        console.error('API create failed:', err);
      }
      // Fallback
      const timestamp = new Date().toISOString();
      const newRecord: Subscription = {
        ...data,
        id: `sub-${Date.now()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const updated = [newRecord, ...subscriptions];
      setSubscriptions(updated);
      saveSubscriptions(updated);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('API delete failed:', err);
    }
    const updated = subscriptions.filter((s) => s.id !== id);
    setSubscriptions(updated);
    saveSubscriptions(updated);
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
    <div className="space-y-6">
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

      <SubscriptionMetrics subscriptions={subscriptions} />

      <SubscriptionTable
        subscriptions={subscriptions}
        onAddNew={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onView={handleViewDetails}
      />

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

