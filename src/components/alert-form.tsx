'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/types';

interface AlertFormProps {
  masterToken: string;
  existing?: Alert;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function AlertForm({ masterToken, existing, onSuccess, onCancel }: AlertFormProps) {
  const [item, setItem] = useState(existing?.item ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [radius, setRadius] = useState(String(existing?.radius_miles ?? 20));
  const [interval, setInterval] = useState(existing?.interval ?? 'daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let res: Response;
      if (existing) {
        res = await fetch(`/api/alerts/${existing.alert_token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item, location, radius_miles: parseInt(radius), interval }),
        });
      } else {
        res = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            master_token: masterToken,
            item,
            location,
            radius_miles: parseInt(radius),
            interval,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save alert');
        return;
      }

      if (!existing) {
        // Show success message for new alerts
        setSuccess('🤖 Agents are scouting now! You\'ll receive your first email in 2-3 minutes with the best deals we find.');
        // Wait 2 seconds before calling onSuccess to let user see the message
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        onSuccess();
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-zinc-300">What are you looking for?</Label>
          <Input
            placeholder='e.g. "road bike"'
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Location</Label>
          <Input
            placeholder="City or ZIP code"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Radius (miles)</Label>
          <Input
            type="number"
            min={1}
            max={500}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-amber-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Check interval</Label>
          <Select value={interval} onValueChange={(v) => v && setInterval(v as typeof interval)}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectItem value="1min">Every minute (demo)</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="6h">Every 6 hours</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-sm bg-red-900/40 text-red-400 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <div className="text-sm bg-emerald-900/40 text-emerald-400 border border-emerald-800 rounded-lg px-3 py-2">
          <p className="font-semibold mb-1">✓ Alert created!</p>
          <p>{success}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || !!success}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
        >
          {loading ? '🤖 Launching agents...' : existing ? 'Save Changes' : '🚀 Start Scouting'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
