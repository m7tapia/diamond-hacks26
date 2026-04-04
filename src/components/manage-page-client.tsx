'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCard } from './alert-card';
import { AlertForm } from './alert-form';
import { Button } from '@/components/ui/button';
import { Alert, User } from '@/types';
import { Plus } from 'lucide-react';

interface ManageData {
  user: User;
  alerts: Alert[];
}

export function ManagePageClient({ masterToken }: { masterToken: string }) {
  const [data, setData] = useState<ManageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/manage/${masterToken}`);
      if (!res.ok) {
        setError('Invalid or expired link. Please request a new sign-in link from the home page.');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Failed to load your alerts. Please refresh.');
    }
  }, [masterToken]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-zinc-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading your alerts...</p>
      </main>
    );
  }

  const { user, alerts } = data;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏆</span>
            <h1 className="text-2xl font-bold text-amber-400">Market-Alchemy AI</h1>
          </div>
          <p className="text-zinc-500 text-sm">
            Manage alerts for <span className="text-zinc-300">{user.email}</span>
          </p>
        </div>

        {/* Add Alert */}
        {showAddForm ? (
          <div className="bg-zinc-900 border border-amber-700 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-zinc-100 mb-4">New Alert</h2>
            <AlertForm
              masterToken={masterToken}
              onSuccess={() => { setShowAddForm(false); load(); }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            className="mb-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Add New Alert
          </Button>
        )}

        {/* Alert list */}
        {alerts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-zinc-400 mb-1">No alerts yet</p>
            <p className="text-zinc-600 text-sm">Add an alert above to start scouting deals</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
              Your Alerts ({alerts.length})
            </h2>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                masterToken={masterToken}
                onRefresh={load}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
