'use client';

import React, { useState } from 'react';
import { INVITED_INSTITUTIONS } from '@/lib/institutions';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/


/* ---------- shared pieces (defined at module level so inputs keep focus) ---------- */

const inputClass =
  'w-full rounded-xl border border-[#231815]/25 bg-[#A5BCD6]/20 px-4 py-3 text-base text-[#231815] placeholder:text-[#231815]/45 transition-colors focus:border-[#4D0E12] focus:outline-none focus:ring-2 focus:ring-[#4D0E12]/30';

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
};

function Field({ label, name, value, onChange, type = 'text', required, placeholder, hint, wide }: FieldProps) {
  return (
    <div className={`space-y-2 ${wide ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={name} className="block text-sm font-semibold">
        {label}
        {required && (
          <span className="text-[#4D0E12]" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className={inputClass}
      />
      {hint && (
        <p id={`${name}-hint`} className="text-sm text-[#231815]/65">
          {hint}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-[#231815]/20 py-12 md:grid-cols-[220px_1fr] md:gap-12">
      <div className="md:pt-1">
        <h2 className="font-serif text-2xl font-bold leading-tight text-[#4D0E12]">{title}</h2>
        {note && <p className="mt-2 text-sm leading-relaxed text-[#231815]/70">{note}</p>}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function PersonFields({
  prefix,
  formData,
  onChange,
}: {
  prefix: 'sp1' | 'sp2' | 'res';
  formData: Record<string, string>;
  onChange: (e: React.ChangeEvent<any>) => void;
}) {
  const v = (k: string) => formData[`${prefix}${k}`];
  const n = (k: string) => `${prefix}${k}`;

  return (
    <>
      <Field label="Full name (first name, surname)" name={n('Name')} value={v('Name')} onChange={onChange} required />
      <Field label="Course" name={n('Course')} value={v('Course')} onChange={onChange} required placeholder="e.g. B.A. LL.B. (Hons.)" />
      <Field label="Year of study" name={n('Year')} value={v('Year')} onChange={onChange} required placeholder="e.g. 3rd Year" />

      <div className="space-y-2">
        <label htmlFor={n('Gender')} className="block text-sm font-semibold">
          Gender
          <span className="text-[#4D0E12]" aria-hidden="true"> *</span>
        </label>
        <select
          id={n('Gender')}
          name={n('Gender')}
          required
          value={v('Gender')}
          onChange={onChange}
          className={inputClass}
        >
          <option value="">Select gender</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <Field label="Contact number" name={n('Contact')} value={v('Contact')} onChange={onChange} type="tel" required />
      <Field label="Email address" name={n('Email')} value={v('Email')} onChange={onChange} type="email" required />
      <Field
        label="Formal photo link"
        name={n('PhotoUrl')}
        value={v('PhotoUrl')}
        onChange={onChange}
        type="url"
        required
        placeholder="https://drive.google.com/..."
        hint="Paste a shareable Google Drive or cloud link."
      />
      <Field label="LinkedIn profile link" name={n('Linkedin')} value={v('Linkedin')} onChange={onChange} type="url" placeholder="Optional" />
    </>
  );
}

/* ---------- page ---------- */

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    university: '',
    address: '',
    deanName: '',
    deanEmail: '',
    pocContact: '',
    pocEmail: '',
    bonafideUrl: '',

    // Speaker 1
    sp1Name: '',
    sp1Course: '',
    sp1Year: '',
    sp1Contact: '',
    sp1Email: '',
    sp1Gender: '',
    sp1PhotoUrl: '',
    sp1Linkedin: '',

    // Speaker 2
    sp2Name: '',
    sp2Course: '',
    sp2Year: '',
    sp2Contact: '',
    sp2Email: '',
    sp2Gender: '',
    sp2PhotoUrl: '',
    sp2Linkedin: '',

    // Researcher
    resName: '',
    resCourse: '',
    resYear: '',
    resContact: '',
    resEmail: '',
    resGender: '',
    resPhotoUrl: '',
    resLinkedin: '',
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          loading: false,
          success: true,
          message: 'Registration submitted successfully. The details have been recorded.',
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: data.error || 'Submission failed. Please check details and try again.',
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({
        loading: false,
        success: false,
        message: 'Network error. Please check your connection.',
      });
    }
  };

  const ring =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32 sm:pb-24 sm:pt-40">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Team registration
          </h1>
          <p className="mt-6 max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/85 sm:text-xl">
            Participation is restricted to invited institutions. Fill in every
            field marked with an asterisk.
          </p>
        </div>
      </header>

      {/* ---------- FORM ---------- */}
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-6">
        <form onSubmit={handleSubmit}>
          <Section
            title="Institution"
            note="Details of the invited institution and your faculty contact."
          >
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="university" className="block text-sm font-semibold">
                Name of the university or institution
                <span className="text-[#4D0E12]" aria-hidden="true"> *</span>
              </label>
              <select
                id="university"
                name="university"
                required
                value={formData.university}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select your invited institution</option>
                {INVITED_INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold">
                Address of the university or institution
                <span className="text-[#4D0E12]" aria-hidden="true"> *</span>
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Full postal address"
                className={`${inputClass} resize-y`}
              />
            </div>

            <Field label="Name of Dean, HOD or MCC coordinator" name="deanName" value={formData.deanName} onChange={handleChange} required />
            <Field label="Email of Dean, HOD or MCC coordinator" name="deanEmail" value={formData.deanEmail} onChange={handleChange} type="email" required />
            <Field
              label="Student point of contact: phone"
              name="pocContact"
              value={formData.pocContact}
              onChange={handleChange}
              type="tel"
              required
              placeholder="+91 9876543210"
              hint="A WhatsApp number is mandatory."
            />
            <Field label="Student point of contact: email" name="pocEmail" value={formData.pocEmail} onChange={handleChange} type="email" required />
            <Field
              label="Bona-fide letter link"
              name="bonafideUrl"
              value={formData.bonafideUrl}
              onChange={handleChange}
              type="url"
              required
              wide
              placeholder="https://drive.google.com/..."
              hint="Paste a shareable Google Drive or cloud link."
            />
          </Section>

          <Section title="Speaker 1" note="First team member who will argue.">
            <PersonFields prefix="sp1" formData={formData} onChange={handleChange} />
          </Section>

          <Section title="Speaker 2" note="Second team member who will argue.">
            <PersonFields prefix="sp2" formData={formData} onChange={handleChange} />
          </Section>

          <Section title="Researcher" note="Team member who handles research and preparation.">
            <PersonFields prefix="res" formData={formData} onChange={handleChange} />
          </Section>

          {/* ---------- SUBMIT ---------- */}
          <div className="space-y-5 border-t border-[#231815]/20 pt-10">
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
              className={`inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#4D0E12] px-6 py-4 text-base font-bold text-[#F5EFC6] transition hover:bg-[#231815] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10 ${ring}`}
            >
              {status.loading ? 'Submitting…' : 'Submit registration'}
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
          </div>
        </form>
      </main>
    </div>
  );
}