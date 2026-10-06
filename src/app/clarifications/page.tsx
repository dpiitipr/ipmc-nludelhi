'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { INVITED_INSTITUTIONS } from '@/lib/institutions';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

const EMPTY = {
  name: '',
  email: '',
  institution: '',
  reference: '',
  question: '',
  hp_check: '', // honeypot: real people never see or fill this
};

export default function ClarificationsPage() {
  const [formData, setFormData] = useState(EMPTY);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Bring the confirmation into view and announce it
  useEffect(() => {
    if (submittedEmail !== null) {
      doneRef.current?.scrollIntoView({ block: 'center' });
      doneRef.current?.focus();
    }
  }, [submittedEmail]);
  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({ loading: false, success: null, message: '' });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, message: '' });

    try {
      const res = await fetch('/api/clarifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus({ loading: false, success: true, message: '' });
        setSubmittedEmail(formData.email);
        setFormData(EMPTY);
      } else {
        setStatus({
          loading: false,
          success: false,
          message: data.error || `Something went wrong (error ${res.status}). Please try again.`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({
        loading: false,
        success: false,
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const ring =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';
  const inputClass =
    'w-full rounded-xl border border-[#231815]/25 bg-[#A5BCD6]/20 px-4 py-3 text-base text-[#231815] placeholder:text-[#231815]/45 transition-colors focus:border-[#4D0E12] focus:outline-none focus:ring-2 focus:ring-[#4D0E12]/30';
  const labelClass = 'block text-sm font-semibold';
  const star = (
    <span className="text-[#4D0E12]" aria-hidden="true">
      {' '}
      *
    </span>
  );

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32 sm:pb-24 sm:pt-40">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Clarifications
          </h1>
          <p className="mt-6 max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/85 sm:text-xl">
            Is something in the moot problem unclear? Ask the organising
            committee to clarify it.
          </p>
        </div>
      </header>

      {/* ---------- FORM ---------- */}
      <main className="mx-auto max-w-3xl px-6 pb-28 pt-16 sm:pt-20">
        <p className="mb-10 text-justify font-serif text-lg leading-relaxed text-[#231815]/85 hyphens-auto">
          This page is only for clarifications on the moot problem. Please read
          the moot problem in the{' '}
          <Link
            href="/#materials"
            className={`font-semibold text-[#4D0E12] underline underline-offset-4 ${ring}`}
          >
            competition materials
          </Link>{' '}
          first, since your question may already be answered there. For
          registration, rules or anything else, use the{' '}
          <Link
            href="/contact"
            className={`font-semibold text-[#4D0E12] underline underline-offset-4 ${ring}`}
          >
            contact page
          </Link>
          .
        </p>

        {submittedEmail !== null ? (
          <div
            ref={doneRef}
            tabIndex={-1}
            role="status"
            className="rounded-3xl bg-[#A5BCD6] p-8 text-[#231815] outline-none sm:p-12"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#231815] text-[#F5EFC6]">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
            </div>
            <h2 className="mt-6 font-serif text-3xl font-bold sm:text-4xl">
              Submitted successfully
            </h2>
            <p className="mt-3 max-w-[52ch] text-lg leading-relaxed">
              Your clarification request has been recorded.
            </p>
            <button
              type="button"
              onClick={() => setSubmittedEmail(null)}
              className={`mt-8 inline-flex items-center rounded-xl bg-[#4D0E12] px-6 py-3 text-base font-bold text-[#F5EFC6] transition hover:bg-[#231815] ${ring}`}
            >
              Submit another clarification
            </button>
          </div>
        ) : (
        <section
          aria-labelledby="clar-h"
          className="rounded-3xl border border-[#231815]/20 p-7 shadow-[0_24px_60px_-28px_rgba(35,24,21,0.45)] sm:p-10"
        >
          <h2 id="clar-h" className="font-serif text-3xl font-bold text-[#4D0E12]">
            Ask about the moot problem
          </h2>
          <p className="mt-2 text-base text-[#231815]/75">Fields marked * are required.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className={labelClass}>
                  Full name{star}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className={labelClass}>
                  Email address{star}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@university.edu"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="institution" className={labelClass}>
                Institution{star}
              </label>
              <select
                id="institution"
                name="institution"
                required
                value={formData.institution}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select your institution</option>
                {INVITED_INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="reference" className={labelClass}>
                Where in the moot problem?
              </label>
              <input
                id="reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Optional"
                aria-describedby="reference-hint"
                className={inputClass}
              />
              <p id="reference-hint" className="text-sm text-[#231815]/65">
                For example, a paragraph, fact or issue number.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="question" className={labelClass}>
                Your clarification{star}
              </label>
              <textarea
                id="question"
                name="question"
                required
                rows={7}
                value={formData.question}
                onChange={handleChange}
                placeholder="State exactly what needs to be clarified and why."
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* honeypot */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="hp_check">Leave this field empty</label>
              <input
                id="hp_check"
                name="hp_check"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.hp_check}
                onChange={handleChange}
              />
            </div>

            {status.message && (
              <div
                role={status.success ? 'status' : 'alert'}
                className={`rounded-2xl px-5 py-4 text-sm font-semibold ${
                  status.success
                    ? 'bg-[#A5BCD6] text-[#231815]'
                    : 'border border-[#A5BCD6]/40 bg-[#4D0E12] text-[#F5EFC6]'
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={status.loading}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#4D0E12] px-6 py-4 text-base font-bold text-[#F5EFC6] transition hover:bg-[#231815] disabled:cursor-wait disabled:opacity-60 ${ring}`}
            >
              {status.loading ? 'Sending…' : 'Submit clarification request'}
              {!status.loading && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 10h12m0 0l-4-4m4 4l-4 4" />
                </svg>
              )}
            </button>
          </form>
        </section>
        )}
      </main>
    </div>
  );
}