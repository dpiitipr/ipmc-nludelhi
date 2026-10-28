'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputClass =
  'w-full rounded-xl border border-[#231815]/25 bg-[#A5BCD6]/20 px-4 py-3 text-base text-[#231815] placeholder:text-[#231815]/45 focus:border-[#4D0E12] focus:outline-none focus:ring-2 focus:ring-[#4D0E12]/30';

export default function LoginPage() {
  const router = useRouter();
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not sign in. Please try again.');
        setBusy(false);
        return;
      }
      router.push('/portal');
      router.refresh();
    } catch {
      setError('Network error. Please check your connection.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32 sm:pt-40">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">Team login</h1>
          <p className="mt-6 max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/85 sm:text-xl">
            Sign in with the team code and password sent to your point of contact.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-16">
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="teamCode" className="block text-sm font-semibold">Team code</label>
            <input id="teamCode" required autoComplete="username" value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold">Password</label>
            <input id="password" type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>

          {error && (
            <div role="alert" className="rounded-2xl bg-[#4D0E12] px-5 py-4 text-sm font-semibold text-[#F5EFC6]">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full rounded-xl bg-[#4D0E12] px-6 py-4 text-base font-bold text-[#F5EFC6] transition hover:bg-[#231815] disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-sm text-[#231815]/70">
            Lost your password? Email dpiit.ipr@nludelhi.ac.in and we will resend it.
          </p>
        </form>
      </main>
    </div>
  );
}