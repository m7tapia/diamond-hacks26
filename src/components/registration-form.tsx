'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Something went wrong' });
        return;
      }

      // Redirect straight to the manage page
      if (data.manageUrl) {
        window.location.href = data.manageUrl;
        return;
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error — please try again' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-zinc-300">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500"
        />
      </div>

      {message && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            message.type === 'success'
              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
              : 'bg-red-900/40 text-red-400 border border-red-800'
          }`}
        >
          {message.text}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
      >
        {loading ? 'Sending...' : 'Get Started →'}
      </Button>
    </form>
  );
}
