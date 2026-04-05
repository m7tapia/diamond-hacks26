'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegistrationForm() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const endpoint = mode === 'signup' ? '/api/users' : '/api/users/signin';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Something went wrong' });
        return;
      }

      if (data.master_token) {
        window.location.href = `/manage/${data.master_token}`;
        return;
      }

      setMessage({ type: 'success', text: data.message ?? 'Success' });
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'Network error — please try again' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
            mode === 'signup'
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Create account
        </button>
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
            mode === 'signin'
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Sign in
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="text-sm text-zinc-400 mb-4">
          {mode === 'signup'
            ? 'New here? Create a password-protected account and manage your alerts securely.'
            : 'Welcome back. Sign in with your email and password to manage your alerts.'}
        </p>

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

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-300">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500"
          />
        </div>
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
        {loading ? 'Processing...' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}
