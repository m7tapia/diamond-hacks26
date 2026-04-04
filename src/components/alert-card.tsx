'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertForm } from './alert-form';
import { Alert } from '@/types';
import { INTERVAL_LABELS } from '@/lib/constants';

interface AlertCardProps {
  alert: Alert;
  masterToken: string;
  onRefresh: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AlertCard({ alert, masterToken, onRefresh }: AlertCardProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function patchStatus(status: string) {
    setLoading(status);
    try {
      await fetch(`/api/alerts/${alert.alert_token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    setLoading('cancel');
    try {
      await fetch(`/api/alerts/${alert.alert_token}`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setLoading(null);
      setConfirmCancel(false);
    }
  }

  const statusColor = {
    active: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    paused: 'bg-amber-900/50 text-amber-400 border-amber-800',
    cancelled: 'bg-red-900/50 text-red-400 border-red-800',
  }[alert.status] ?? '';

  if (editing) {
    return (
      <div className="bg-zinc-900 border border-amber-700 rounded-xl p-5">
        <h3 className="font-semibold text-zinc-100 mb-4">Edit Alert</h3>
        <AlertForm
          masterToken={masterToken}
          existing={alert}
          onSuccess={() => { setEditing(false); onRefresh(); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-100 text-lg">{alert.item}</h3>
          <p className="text-zinc-500 text-sm">
            {alert.location} · {alert.radius_miles}mi · {INTERVAL_LABELS[alert.interval]}
          </p>
        </div>
        <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
          {alert.status}
        </span>
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
        <div>
          <span className="text-zinc-600">Last run: </span>
          {formatDate(alert.last_run_at)}
        </div>
        <div>
          <span className="text-zinc-600">Next run: </span>
          {alert.status === 'active' ? formatDate(alert.next_run_at) : '—'}
        </div>
        <div>
          <span className="text-zinc-600">Created: </span>
          {formatDate(alert.created_at)}
        </div>
      </div>

      {/* Actions */}
      {confirmCancel ? (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm text-zinc-400">Cancel this alert permanently?</span>
          <Button
            size="sm"
            variant="destructive"
            disabled={loading === 'cancel'}
            onClick={handleCancel}
            className="bg-red-700 hover:bg-red-600 text-white"
          >
            {loading === 'cancel' ? 'Cancelling...' : 'Yes, cancel'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmCancel(false)}
            className="border-zinc-700 text-zinc-400"
          >
            Keep it
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {alert.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              disabled={!!loading}
              onClick={() => patchStatus('paused')}
              className="border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs"
            >
              {loading === 'paused' ? 'Pausing...' : 'Pause'}
            </Button>
          )}
          {alert.status === 'paused' && (
            <Button
              size="sm"
              variant="outline"
              disabled={!!loading}
              onClick={() => patchStatus('active')}
              className="border-emerald-800 text-emerald-400 hover:text-emerald-300 text-xs"
            >
              {loading === 'active' ? 'Resuming...' : 'Resume'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmCancel(true)}
            className="border-red-900 text-red-500 hover:text-red-400 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
