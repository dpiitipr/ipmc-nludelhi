'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { hygraphClient } from '@/lib/hygraph';
import { GET_VIDHI_CONTENT } from '@/lib/queries';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

export default function ContactPage() {
  const [content, setContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({
    loading: false,
    success: null,
    message: '',
  });

  // Fetch Hygraph content for student convenors & coordinators
  useEffect(() => {
    async function fetchContent() {
      try {
        const data: any = await hygraphClient.request(GET_VIDHI_CONTENT);
        if (data?.vidhiMarketings?.[0]) {
          setContent(data.vidhiMarketings[0]);
        }
      } catch (err) {
        console.error('Hygraph Fetch Error:', err);
      }
    }
    fetchContent();
  }, []);

  // Format Hygraph names array or string with clean comma separation
  const formattedConvenors = useMemo(() => {
    const raw =
      content?.studentConvenors ||
      content?.convenors ||
      ['Apurva Tayal', 'Chaitrali Naik', 'Shivank Yadav'];

    if (Array.isArray(raw)) {
      if (raw.length === 1) return raw[0];
      if (raw.length === 2) return `${raw[0]} and ${raw[1]}`;
      return `${raw.slice(0, -1).join(', ')}, and ${raw[raw.length - 1]}`;
    }

    if (typeof raw === 'string') {
      return raw.replace(/,\s*/g, ', ');
    }

    return 'Apurva Tayal, Chaitrali Naik, and Shivank Yadav';
  }, [content]);

  const formattedCoordinator = useMemo(() => {
    const raw =
      content?.researchCoordinator ||
      content?.coordinator ||
      'Nishtha Sharma';

    if (Array.isArray(raw)) {
      return raw.join(', ');
    }

    return String(raw);
  }, [content]);

  // Map coordinates, falling back to NLU Delhi
  const mapCoords = useMemo(() => {
    const lat =
      content?.mapCoordinates?.latitude ||
      content?.coordinates?.latitude ||
      content?.location?.latitude ||
      28.5996751;

    const lng =
      content?.mapCoordinates?.longitude ||
      content?.coordinates?.longitude ||
      content?.location?.longitude ||
      77.0232522;

    return { lat, lng };
  }, [content]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, message: '' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          loading: false,
          success: true,
          message: 'Your query has been sent successfully. Our team will get back to you shortly.',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          institution: '',
          subject: '',
          message: '',
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: data.error || 'Something went wrong. Please try again.',
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

  const ringLight =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';
  const ringDark =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A5BCD6]';

  const inputClass =
    'w-full rounded-xl border border-[#231815]/25 bg-[#A5BCD6]/20 px-4 py-3 text-base text-[#231815] placeholder:text-[#231815]/45 transition-colors focus:border-[#4D0E12] focus:outline-none focus:ring-2 focus:ring-[#4D0E12]/30';
  const labelClass = 'block text-sm font-semibold text-[#231815]';
  const required = <span className="text-[#4D0E12]" aria-hidden="true"> *</span>;

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pb-28 sm:pt-40">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Contact us
          </h1>
          <p className="mt-6 max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/85 sm:text-xl">
            Questions about the moot proposition, rules or registration for
            Vidhi Pragati? Write to the organising committee.
          </p>
        </div>
      </header>

      {/* ---------- MAIN GRID ---------- */}
      <main className="mx-auto grid max-w-6xl gap-10 px-6 pb-28 pt-16 sm:pt-20 lg:grid-cols-12 lg:gap-14">
        {/* Form (primary action, first on every screen size) */}
        <section
          aria-labelledby="form-h"
          className="rounded-3xl border border-[#231815]/20 bg-[#F5EFC6] p-7 shadow-[0_24px_60px_-28px_rgba(35,24,21,0.55)] sm:p-10 lg:col-span-7"
        >
          <h2 id="form-h" className="font-serif text-3xl font-bold text-[#4D0E12]">
            Send your query
          </h2>
          <p className="mt-2 max-w-[52ch] text-base text-[#231815]/75">
            Fields marked * are required. We reply to the email address you provide.
          </p>

          {status.message && (
            <div
              role={status.success ? 'status' : 'alert'}
              className={`mt-6 rounded-2xl px-5 py-4 text-sm font-semibold ${
                status.success
                  ? 'bg-[#A5BCD6] text-[#231815]'
                  : 'border border-[#A5BCD6]/40 bg-[#4D0E12] text-[#F5EFC6]'
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className={labelClass}>
                  Full name{required}
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ananya Sharma"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className={labelClass}>
                  Email address{required}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@university.edu"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="institution" className={labelClass}>
                  Law school or institution
                </label>
                <input
                  id="institution"
                  type="text"
                  name="institution"
                  autoComplete="organization"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="e.g. NLU Delhi"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className={labelClass}>
                Topic{required}
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select a topic</option>
                <option value="Moot Proposition Clarification">Moot Proposition Clarification</option>
                <option value="Registration & Eligibility">Registration &amp; Eligibility</option>
                <option value="Rules & Guidelines">Rules &amp; Guidelines</option>
                <option value="Schedule & Timeline">Schedule &amp; Timeline</option>
                <option value="General Query">General Query</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className={labelClass}>
                Message{required}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe your question in as much detail as you can."
                className={`${inputClass} resize-y`}
              />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#4D0E12] px-6 py-4 text-base font-bold text-[#F5EFC6] transition hover:bg-[#231815] disabled:cursor-wait disabled:opacity-60 ${ringLight}`}
            >
              {status.loading ? 'Sending…' : 'Send query'}
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

        {/* Committee and campus details */}
        <aside
          aria-labelledby="committee-h"
          className="space-y-8 rounded-3xl bg-[#231815] p-7 text-[#F5EFC6] sm:p-10 lg:col-span-5 lg:self-start"
        >
          <div className="flex items-center gap-4 border-b border-[#A5BCD6]/25 pb-6">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#F5EFC6]">
              <Image
                src="/vidhi_logo.PNG"
                alt="Vidhi Pragati IPMC logo"
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </div>
            <h2 id="committee-h" className="font-serif text-2xl font-bold leading-tight">
              Organising committee
            </h2>
          </div>

          <dl className="space-y-6">
            <div>
              <dt className="text-sm text-[#A5BCD6]">Moot Director</dt>
              <dd className="mt-1 text-base font-semibold leading-snug">{formattedCoordinator}</dd>
            </div>

            <div>
              <dt className="text-sm text-[#A5BCD6]">Student Coordinators</dt>
              <dd className="mt-1 text-base font-semibold leading-snug">{formattedConvenors}</dd>
            </div>

            <div className="border-t border-[#A5BCD6]/25 pt-6">
              <dt className="text-sm text-[#A5BCD6]">Email</dt>
              <dd className="mt-1">
                <a
                  href="mailto:dpiit.ipr@nludelhi.ac.in"
                  className={`break-all text-base font-semibold underline decoration-[#A5BCD6]/50 underline-offset-4 transition hover:decoration-[#F5EFC6] ${ringDark}`}
                >
                  dpiit.ipr@nludelhi.ac.in
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-sm text-[#A5BCD6]">Campus</dt>
              <dd className="mt-1 text-base leading-relaxed">
                <address className="not-italic">
                  <span className="font-semibold">National Law University Delhi</span>
                  <br />
                  Sector 14, Dwarka
                  <br />
                  New Delhi – 110078
                </address>
              </dd>
            </div>

            <div>
              <dt className="text-sm text-[#A5BCD6]">Office hours</dt>
              <dd className="mt-1 text-base leading-relaxed">
                Monday – Friday: 10:00 am – 5:00 pm
                <br />
                Saturday: 10:00 am – 2:00 pm
              </dd>
            </div>
          </dl>

          <div className="h-60 w-full overflow-hidden rounded-2xl bg-[#4A2E27] ring-1 ring-[#A5BCD6]/30">
            <iframe
              title="National Law University Delhi map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=17&output=embed`}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}