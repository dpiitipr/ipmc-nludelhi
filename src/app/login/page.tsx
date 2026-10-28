'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

export default function LoginPage() {
  const router = useRouter();
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
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

  const field =
    'peer w-full border-0 border-b-2 border-[#231815]/30 bg-transparent px-0 pb-2 pt-6 text-lg text-[#231815] placeholder-transparent transition-colors focus:border-[#4D0E12] focus:outline-none focus:ring-0';
  const floating =
    'pointer-events-none absolute left-0 top-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#231815]/60 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-[#4D0E12]';

  return (
    <div className="grid min-h-screen bg-[#231815] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6] lg:grid-cols-[1.1fr_1fr]">
      {/* ---------- poster panel ---------- */}
      <aside className="relative isolate hidden overflow-hidden text-[#F5EFC6] lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-6 -z-10 select-none font-serif text-[clamp(10rem,24vw,22rem)] font-bold leading-none text-transparent"
          style={{ WebkitTextStroke: '1.5px rgba(165,188,214,0.28)' }}
        >
          2027
        </span>

        <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-[#A5BCD6]">
          <span className="h-px w-10 bg-[#A5BCD6]" />
          NLU DELHI · DPIIT IPR CHAIR
        </div>

        <div>
          <p className="max-w-md font-serif text-xl italic leading-snug text-[#F5EFC6]/85">
            All rise. Your team&apos;s rounds, memorials and logistics are kept here.
          </p>
          <h1 className="mt-6 font-serif text-7xl font-bold leading-[0.95] tracking-tight xl:text-8xl">
            Vidhi
            <br />
            Pragati
          </h1>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#A5BCD6]">
            National IP Moot Court Competition
          </p>
        </div>
      </aside>

      {/* ---------- docket panel ---------- */}
      <main className="flex items-center justify-center bg-[#F5EFC6] px-6 py-16 sm:px-12 lg:rounded-l-[2.5rem]">
        <div className="w-full max-w-md">
          {/* shown on mobile only, where the poster is hidden */}
          <div className="mb-10 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D0E12]">Vidhi Pragati 2027</p>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D0E12]">Participant docket</p>
          <h2 className="mt-3 font-serif text-5xl font-bold leading-tight text-[#231815]">Team sign in</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#231815]/75">
            Use the team code and password sent to your point of contact. Only your team code identifies you in the
            competition.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-8" noValidate>
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-0 font-serif text-lg font-bold text-[#4D0E12] opacity-0 transition-opacity peer-focus:opacity-100 peer-not-placeholder-shown:opacity-100"
              >
                #
              </span>
              <input
                id="teamCode" required autoComplete="username" autoCapitalize="characters" spellCheck={false}
                placeholder="Team code" value={teamCode} onChange={(e) => setTeamCode(e.target.value)}
                className={`${field} peer-focus:pl-5 focus:pl-5 not-placeholder-shown:pl-5`}
              />
              <label htmlFor="teamCode" className={floating}>Team code</label>
            </div>

            <div className="relative">
              <input
                id="password" required type={show ? 'text' : 'password'} autoComplete="current-password"
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
                onKeyDown={(e) => setCaps(e.getModifierState('CapsLock'))}
                className={`${field} pr-16`}
              />
              <label htmlFor="password" className={floating}>Password</label>
              <button
                type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}
                className="absolute bottom-2 right-0 text-sm font-semibold text-[#4D0E12] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>

            {caps && (
              <p role="status" className="-mt-4 text-sm font-semibold text-[#4D0E12]">Caps Lock is on.</p>
            )}

            {error && (
              <div role="alert" className="flex gap-3 rounded-xl bg-[#4D0E12] px-5 py-4 text-sm font-semibold text-[#F5EFC6]">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="10" cy="10" r="8" /><path d="M10 6v5M10 14h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={busy}
              className="group flex w-full items-center justify-between rounded-2xl bg-[#231815] px-7 py-5 text-base font-bold text-[#F5EFC6] transition hover:bg-[#4D0E12] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]"
            >
              <span>{busy ? 'Checking your docket…' : 'Enter the portal'}</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12m0 0l-4-4m4 4l-4 4" />
              </svg>
            </button>
          </form>

          <p className="mt-10 border-t border-[#231815]/20 pt-6 text-sm text-[#231815]/70">
            Lost your password? Email{' '}
            <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="font-semibold text-[#4D0E12] underline underline-offset-4">
              dpiit.ipr@nludelhi.ac.in
            </a>{' '}
            and we will resend it.
          </p>
        </div>
      </main>
    </div>
  );
}