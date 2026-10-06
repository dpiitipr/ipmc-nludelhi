'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { hygraphClient } from '@/lib/hygraph';
import { GET_VIDHI_CONTENT } from '@/lib/queries';
import AbstractArt from '@/components/AbstractArt';
import MaterialsList from '@/components/MaterialsList';
import { normalizeMaterials, hasAnyFile } from '@/lib/materials';

/*
  Palette (from the supplied swatches only):
  Transparent Yellow  #F5EFC6  light surface, text on dark
  Sceptre Red         #4D0E12  accent, active states
  Cerulean Blue       #A5BCD6  cool highlight, section contrast
  Potting Soil        #4A2E27  secondary dark
  Java Brown          #231815  base dark, text on light
  Tints use opacity modifiers of these same hex values.
*/

const FALLBACK_ABOUT =
  'The Vidhi Pragati National IP Moot Court Competition (IPMC) is organized by National Law University Delhi in collaboration with CIPAM, DPIIT, and CIIPC. Designed as a landmark academic forum, Vidhi Pragati brings together law students from top universities across India to engage in thought-provoking advocacy, complex Intellectual Property disputes, and emerging jurisprudence.';

/* ---------- date helpers (always shown in IST, day-first) ---------- */

type DateParts = { d: string; m: string; y: string };

const dateParts = (value: string): DateParts => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(value));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { d: get('day'), m: get('month'), y: get('year') };
};

const full = (x: DateParts) => `${x.d} ${x.m} ${x.y}`;

// "05 Jan 2027", "05 – 12 Jan 2027", "28 Jan – 04 Feb 2027" or a full range across years
const formatRange = (start?: string, end?: string) => {
  if (!start) return 'TBA';
  try {
    const s = dateParts(start);
    if (!end) return full(s);
    const e = dateParts(end);
    if (full(s) === full(e)) return full(s);
    if (s.m === e.m && s.y === e.y) return `${s.d} – ${e.d} ${s.m} ${s.y}`;
    if (s.y === e.y) return `${s.d} ${s.m} – ${e.d} ${e.m} ${s.y}`;
    return `${full(s)} – ${full(e)}`;
  } catch {
    return 'TBA';
  }
};

/* ---------- resources fallback ----------
   Used only if the main query returned no resource files. */

async function fetchResources(): Promise<any[]> {
  try {
    const data: any = await hygraphClient.request(
      `query HomeResources { vidhiMarketings(first: 1) { resources { id title file { id url fileName mimeType } } } }`
    );
    const list = data?.vidhiMarketings?.[0]?.resources;
    if (Array.isArray(list)) {
      if (list.length === 0) {
        console.warn('Resources query worked but returned 0 items. Are the entries and assets Published?');
      }
      return list;
    }
  } catch (err) {
    console.error('Could not load resources from Hygraph. Check the resource component fields.', err);
  }
  return [];
}

export default function HomePage() {
  const [content, setContent] = useState<any>(null);
  const [fetchedResources, setFetchedResources] = useState<any[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [heroBgIndex, setHeroBgIndex] = useState<number>(0);

  // Organizer carousel
  const [slide, setSlide] = useState(0);
  const [perView, setPerView] = useState(3);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Local campus photos gallery
  const campusImages = [
    '/2A3A0323.JPG',
    '/2A3A9002.JPG',
    '/2A3A9270.JPG',
    '/2A3A9580.JPG',
    '/SAN_1069.JPG',
  ];

  // Timer
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Background rotator
  useEffect(() => {
    const bgTimer = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % campusImages.length);
    }, 4500);
    return () => clearInterval(bgTimer);
  }, [campusImages.length]);

  // Hygraph fetch (resources come with it; the fallback runs only if no files were returned)
  useEffect(() => {
    async function fetchContent() {
      try {
        const data: any = await hygraphClient.request(GET_VIDHI_CONTENT);
        const first = data?.vidhiMarketings?.[0];
        if (first) {
          setContent(first);
          if (!hasAnyFile(first.resources)) {
            setFetchedResources(await fetchResources());
          }
        }
      } catch (err) {
        console.error('Hygraph Fetch Error:', err);
        // The main query failed (for example a field mismatch): still try resources alone
        setFetchedResources(await fetchResources());
      }
    }
    fetchContent();
  }, []);

  // Timeline milestones
  const processedTimeline = useMemo(() => {
    if (!content?.timeline || !Array.isArray(content.timeline) || !now) return [];

    const sorted = [...content.timeline].sort((a: any, b: any) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aTime - bTime;
    });

    const nowMs = now.getTime();
    const activeIdx = sorted.findIndex((item: any) => {
      const targetTime = new Date(item.endDate || item.startDate).getTime();
      return targetTime > nowMs;
    });

    return sorted.map((item: any, idx: number) => {
      const targetMs = new Date(item.endDate || item.startDate).getTime();
      const isPassed = nowMs > targetMs;
      const isActive = activeIdx !== -1 ? idx === activeIdx : idx === sorted.length - 1;
      return { ...item, isActive, isPassed };
    });
  }, [content, now]);

  const activeMilestone = processedTimeline.find((item) => item.isActive);

  // Live countdown
  const countdown = useMemo(() => {
    if (!activeMilestone || !now) return { days: '00', hours: '00', mins: '00', secs: '00' };

    const targetTime = new Date(activeMilestone.endDate || activeMilestone.startDate).getTime();
    const diff = targetTime - now.getTime();

    if (diff <= 0) return { days: '00', hours: '00', mins: '00', secs: '00' };

    return {
      days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0'),
      hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
      mins: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
      secs: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0'),
    };
  }, [activeMilestone, now]);

  // Resources: from the main query if it has files, otherwise the fallback fetch
  const resourcesList = useMemo(() => {
    const source = hasAnyFile(content?.resources) ? content.resources : fetchedResources;
    return normalizeMaterials(source, 'resource');
  }, [content, fetchedResources]);

  // Order: DPIIT, CIPAM, NLU Delhi, DPIIT IPR Chair, CIIPC
  const organizers = [
    {
      name: 'Department for Promotion of Industry and Internal Trade',
      title: 'DTI',
      logo: '/dtiip-logo.png',
      link: 'https://www.dpiit.gov.in/',
    },
    {
      name: 'Cell for IPR Promotion and Management',
      title: 'CIPAM',
      logo: '/ipam-logo.png',
      link: 'https://cipam.gov.in/',
    },
    {
      name: 'National Law University Delhi',
      title: 'NLUD',
      logo: '/nlud-logo.png',
      link: 'https://nludelhi.ac.in/',
    },
    {
      name: 'DPIIT Chair on Intellectual Property Rights, NLU Delhi',
      title: 'DPIIT IPR Chair',
      logo: '/NLU-Delhi-DPIIT-IPR-Chair.png',
      link: 'https://nludelhi.ac.in/dpiit-ipr-chair/',
    },
    {
      name: 'Centre for Innovation, Intellectual Property and Competition',
      title: 'CIIPC',
      logo: '/ciipc-logo.png',
      link: 'https://nludelhi.ac.in/research/centre-for-innovation-intellectual-property-and-competition-ciipc/',
    },
  ];

  /* ---------- organizer carousel: 3 / 2 / 1 per view ---------- */
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const update = () =>
      setPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const maxSlide = Math.max(0, organizers.length - perView);

  useEffect(() => {
    setSlide((s) => Math.min(s, maxSlide));
  }, [maxSlide]);

  const autoplay = !hoverPaused && !userPaused && !reduceMotion && maxSlide > 0;

  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(() => setSlide((s) => (s >= maxSlide ? 0 : s + 1)), 3500);
    return () => clearInterval(t);
  }, [autoplay, maxSlide]);

  const prevSlide = () => setSlide((s) => (s <= 0 ? maxSlide : s - 1));
  const nextSlide = () => setSlide((s) => (s >= maxSlide ? 0 : s + 1));

  /* ---------- about copy ---------- */
  const aboutText =
    content?.aboutInc?.content || content?.aboutMoot || content?.aboutNlu?.content || '';
  const aboutFull = (aboutText || FALLBACK_ABOUT).trim();

  const ringLight =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';
  const ringDark =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A5BCD6]';
  const roundBtn = `flex h-11 w-11 items-center justify-center rounded-full border border-[#231815]/40 text-[#231815] transition hover:bg-[#231815] hover:text-[#F5EFC6] ${ringLight}`;

  const timerUnits: [string, string][] = [
    [countdown.days, 'days'],
    [countdown.hours, 'hours'],
    [countdown.mins, 'minutes'],
    [countdown.secs, 'seconds'],
  ];

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- 1. HERO ---------- */}
      <section className="relative isolate flex min-h-svh flex-col justify-between overflow-hidden bg-[#231815] text-[#F5EFC6]">
        {/* Photo crossfade */}
        <div className="absolute inset-0 -z-20">
          {campusImages.map((src: string, idx: number) => (
            <div
              key={src}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                idx === heroBgIndex ? 'scale-105 opacity-100' : 'scale-100 opacity-0'
              }`}
            >
              <Image
                alt=""
                src={src}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-[#231815]/75 via-[#4D0E12]/55 to-[#231815]" />

        {/* Oversized year as a typographic backdrop */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-24 -z-10 select-none font-serif text-[clamp(8rem,28vw,22rem)] font-bold leading-none text-transparent"
          style={{ WebkitTextStroke: '1.5px rgba(165,188,214,0.35)' }}
        >
          2027
        </span>

        {/* Title block */}
        <div className="mx-auto w-full max-w-6xl px-6 pt-32 sm:pt-40">
          <p className="max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-base italic leading-snug text-[#F5EFC6]/90 sm:text-xl">
            3rd National IP Moot Court Competition (IPMC)
          </p>

          <h1 className="mt-6 font-serif text-6xl font-bold leading-[0.95] tracking-tight sm:text-8xl md:text-9xl">
            Vidhi
            <br />
            Pragati
          </h1>

          <Link
            href="/register"
            className={`mt-10 inline-flex items-center gap-3 rounded-full bg-[#F5EFC6] px-8 py-3.5 text-sm font-bold text-[#231815] transition hover:bg-[#A5BCD6] ${ringDark}`}
          >
            Register now
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
          </Link>
        </div>

        {/* Countdown */}
        {activeMilestone ? (
          <div className="mx-auto mb-10 mt-16 w-full max-w-6xl px-6 sm:mb-14">
            <div className="grid items-center gap-6 rounded-2xl border border-[#A5BCD6]/30 bg-[#4D0E12]/80 p-5 backdrop-blur-md sm:grid-cols-[1fr_auto] sm:gap-10 sm:p-7">
              <div>
                <p className="text-sm text-[#A5BCD6]">Next deadline</p>
                <p className="mt-1 line-clamp-2 font-serif text-xl font-bold leading-snug sm:text-2xl">
                  {activeMilestone.title}
                </p>
              </div>

              <div
                className="grid grid-cols-4 gap-2 sm:gap-4"
                role="timer"
                aria-label="Time remaining"
              >
                {timerUnits.map(([value, label]) => (
                  <div
                    key={label}
                    className="min-w-15 rounded-xl bg-[#231815]/70 px-2 py-3 text-center sm:min-w-21 sm:px-4"
                  >
                    <span className="block font-serif text-3xl font-bold tabular-nums leading-none text-[#F5EFC6] sm:text-5xl">
                      {value}
                    </span>
                    <span className="mt-1.5 block text-[11px] text-[#A5BCD6] sm:text-xs">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-16" />
        )}
      </section>

      {/* ---------- 2. ABOUT ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid items-stretch gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight text-[#4D0E12] sm:text-5xl">
              Welcome to Vidhi Pragati 2027
            </h2>
            <p className="mt-8 whitespace-pre-line text-justify font-serif text-lg leading-[1.85] text-[#231815]/90 hyphens-auto sm:text-xl">
              {aboutFull}
            </p>
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-2xl shadow-[0_24px_60px_-28px_rgba(35,24,21,0.7)] ring-1 ring-[#231815]/15 lg:col-span-5">
            <AbstractArt className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>

      {/* ---------- 3. ORGANIZERS (3-up carousel) ---------- */}
      <section
        aria-label="Organizers"
        className="w-full bg-[#A5BCD6] px-6 py-24"
      >
        <div className="mx-auto max-w-6xl space-y-12">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#231815] sm:text-5xl">
            Meet the Organisers
          </h2>

          <div
            onMouseEnter={() => setHoverPaused(true)}
            onMouseLeave={() => setHoverPaused(false)}
            onFocus={() => setHoverPaused(true)}
            onBlur={() => setHoverPaused(false)}
          >
            <div className="-mx-2.5 overflow-hidden py-1">
              <ul
                className="flex transition-transform duration-700 ease-in-out [--w:100%] sm:[--w:50%] lg:[--w:33.3333%] motion-reduce:transition-none"
                style={{ transform: `translateX(calc(-1 * ${slide} * var(--w)))` }}
              >
                {organizers.map((org, idx) => {
                  const visible = idx >= slide && idx < slide + perView;
                  return (
                    <li
                      key={org.name}
                      aria-hidden={!visible}
                      className="basis-full shrink-0 px-2.5 sm:basis-1/2 lg:basis-1/3"
                    >
                      <a
                        href={org.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={visible ? 0 : -1}
                        className={`group flex h-full flex-col rounded-2xl bg-[#F5EFC6] p-8 ring-2 ring-transparent transition hover:ring-[#4D0E12] ${ringLight}`}
                      >
                        {/* fixed-height logo well: every logo is centred on the same line */}
                        <div className="relative h-28 w-full">
                          <Image
                            src={org.logo}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 90vw"
                            className="object-contain"
                          />
                        </div>

                        {/* fixed-height name well: text always starts at the same height */}
                        <div className="mt-6 flex h-22 items-start justify-center border-t border-[#231815]/15 pt-4">
                          <h3 className="line-clamp-3 text-center text-base font-bold leading-snug text-[#231815] transition-colors group-hover:text-[#4D0E12]">
                            {org.name}
                          </h3>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* controls */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button type="button" onClick={prevSlide} aria-label="Previous organizers" className={roundBtn}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 10H4m0 0l4-4m-4 4l4 4" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Go to organizers set ${i + 1}`}
                    aria-current={i === slide ? 'true' : undefined}
                    className={`h-2.5 rounded-full transition-all ${ringLight} ${
                      i === slide ? 'w-8 bg-[#4D0E12]' : 'w-2.5 bg-[#231815]/35 hover:bg-[#231815]/60'
                    }`}
                  />
                ))}
              </div>

              <button type="button" onClick={nextSlide} aria-label="Next organizers" className={roundBtn}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12m0 0l-4-4m4 4l-4 4" />
                </svg>
              </button>

              {!reduceMotion && maxSlide > 0 && (
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-pressed={userPaused}
                  aria-label={userPaused ? 'Resume automatic scrolling' : 'Pause automatic scrolling'}
                  className={roundBtn}
                >
                  {userPaused ? (
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path d="M6 4l10 6-10 6z" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path d="M5 4h4v12H5zM11 4h4v12h-4z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 4. SCHEDULE (a real sequence: vertical timeline) ---------- */}
      {processedTimeline.length > 0 && (
        <section
          id="schedule"
          className="w-full bg-[#231815] px-6 py-24 text-[#F5EFC6]"
        >
          <div className="mx-auto max-w-4xl space-y-14">
            <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
              Event Schedule
            </h2>

            <ol className="relative border-l border-[#A5BCD6]/30">
              {processedTimeline.map((item: any, idx: number) => {
                const formattedDate = formatRange(item.startDate, item.endDate);

                return (
                  <li key={idx} className="relative pb-6 pl-8 last:pb-0 sm:pl-12">
                    {/* marker */}
                    <span
                      aria-hidden="true"
                      className={`absolute -left-1.75 top-7 h-3.5 w-3.5 rounded-full border-2 ${
                        item.isActive
                          ? 'border-[#A5BCD6] bg-[#A5BCD6] ring-4 ring-[#A5BCD6]/25'
                          : item.isPassed
                          ? 'border-[#A5BCD6]/60 bg-[#A5BCD6]/60'
                          : 'border-[#A5BCD6]/40 bg-[#231815]'
                      }`}
                    />

                    <div
                      className={`grid gap-1 rounded-2xl px-5 py-5 sm:grid-cols-[210px_1fr] sm:gap-6 sm:px-6 ${
                        item.isActive
                          ? 'border border-[#A5BCD6]/50 bg-[#4D0E12]'
                          : 'border border-transparent'
                      }`}
                    >
                      <time
                        dateTime={item.startDate || undefined}
                        className={`text-sm font-semibold ${
                          item.isPassed && !item.isActive
                            ? 'text-[#F5EFC6]/50'
                            : 'text-[#A5BCD6]'
                        }`}
                      >
                        {formattedDate}
                      </time>
                      <h3
                        className={`font-serif text-lg font-bold leading-snug sm:text-xl ${
                          item.isPassed && !item.isActive ? 'text-[#F5EFC6]/60' : ''
                        }`}
                      >
                        {item.title}
                        {item.isActive && (
                          <span className="ml-3 inline-block rounded-full bg-[#A5BCD6] px-2.5 py-0.5 align-middle font-sans text-xs font-bold text-[#231815]">
                            Next
                          </span>
                        )}
                      </h3>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* ---------- 5. MATERIALS ---------- */}
      <section id="materials" className="w-full px-6 py-24">
        <div className="mx-auto max-w-4xl space-y-10">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#4D0E12] sm:text-5xl">
            Competition Materials
          </h2>

          {resourcesList.length > 0 ? (
            <MaterialsList items={resourcesList} />
          ) : (
            <p className="rounded-2xl border border-dashed border-[#231815]/30 px-6 py-12 text-center text-[#231815]/70">
              Rulebooks, moot propositions and other official documents will be published here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}