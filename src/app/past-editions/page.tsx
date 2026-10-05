'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { hygraphClient } from '@/lib/hygraph';
import { GET_VIDHI_CONTENT } from '@/lib/queries';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

export default function PastEditionsIndexPage() {
  const [editions, setEditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data: any = await hygraphClient.request(GET_VIDHI_CONTENT);
        if (data?.pastEditions?.length > 0) {
          setEditions(data.pastEditions);
        } else {
          // Fallback static data if Hygraph returns empty array
          setEditions([
            {
              id: '2nd-edition',
              edition: '2nd Edition',
              year: '2024',
              title: '2nd Vidhi Pragati National IP Moot Court Competition',
              theme: 'Trademark and Copyright Jurisprudence',
              description:
                'The 2nd edition brought together over 40 premier law schools across India to deliberate on complex trademark infringement in digital marketplaces, intermediary liability, and copyright ownership in AI-generated artistic works.',
              organisingCommitteePhotos: [{ id: 'oc1', url: '/SAN_1069.JPG' }],
            },
            {
              id: '1st-edition',
              edition: '1st Edition',
              year: '2023',
              title: '1st Vidhi Pragati National IP Moot Court Competition',
              theme: 'Emerging Issues in Patent & Trade Secrets',
              description:
                'Inaugural edition establishing Vidhi Pragati as a premier national platform for intellectual property advocacy and appellate argument in India.',
              organisingCommitteePhotos: [{ id: 'oc2', url: '/2A3A0323.JPG' }],
            },
          ]);
        }
      } catch (err) {
        console.error('Hygraph Fetch Error (Past Editions Index):', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // "2nd Edition" -> "2nd-edition"
  const getSlug = (editionStr: string, fallbackId: string) => {
    if (!editionStr) return fallbackId;
    return editionStr.toLowerCase().trim().replace(/\s+/g, '-');
  };

  const ring =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4D0E12]';

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFC6]" aria-busy="true">
        <div className="h-85 bg-[#231815]" />
        <div className="mx-auto max-w-5xl space-y-16 px-6 py-16">
          {[0, 1].map((i) => (
            <div key={i} className="grid gap-8 md:grid-cols-2">
              <div className="aspect-4/3 animate-pulse rounded-2xl bg-[#231815]/10" />
              <div className="space-y-4 py-4">
                <div className="h-4 w-28 animate-pulse rounded bg-[#231815]/10" />
                <div className="h-8 w-full animate-pulse rounded bg-[#231815]/10" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#231815]/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />

        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32 sm:pb-24 sm:pt-40">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Past editions
          </h1>
          <p className="mt-6 max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/85 sm:text-xl">
            Final-round recordings, moot propositions and organising committee
            photographs from every Vidhi Pragati competition.
          </p>
        </div>
      </header>

      {/* ---------- EDITIONS ---------- */}
      <main className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <ol className="space-y-20 sm:space-y-28">
          {editions.map((ed: any, index: number) => {
            const slug = getSlug(ed.edition, ed.id);
            const coverImage =
              ed.coverImage?.url ||
              ed.organisingCommitteePhotos?.[0]?.url ||
              '/SAN_1069.JPG';
            const flip = index % 2 === 1;

            return (
              <li key={ed.id}>
                <article className="group relative grid items-center gap-8 md:grid-cols-2 md:gap-14">
                  {/* Photo */}
                  <div
                    className={`relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-[#A5BCD6]/30 shadow-[0_22px_50px_-22px_rgba(35,24,21,0.6)] ring-1 ring-[#231815]/15 ${
                      flip ? 'md:order-2' : ''
                    }`}
                  >
                    <Image
                      src={coverImage}
                      alt={`Organising committee, ${ed.edition || 'edition'}`}
                      fill
                      sizes="(min-width: 768px) 45vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* Text */}
                  <div className="space-y-5">

                    <h2 className="font-serif text-2xl font-bold leading-tight sm:text-3xl">
                      {/* stretched link: the whole article is clickable */}
                      <Link
                        href={`/past-editions/${slug}`}
                        className={`transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-[#4D0E12] ${ring}`}
                      >
                        {ed.title}
                      </Link>
                    </h2>

                    {ed.year && (
                      <p className="text-base font-semibold text-[#4D0E12]">{ed.year}</p>
                    )}

                    {ed.theme && (
                      <p className="border-l-2 border-[#4D0E12] pl-4 font-serif italic text-[#231815]/80">
                        {ed.theme}
                      </p>
                    )}

                    {ed.description && (
                      <p className="line-clamp-3 max-w-[56ch] text-justify text-base leading-relaxed text-[#231815]/75 hyphens-auto">
                        {ed.description}
                      </p>
                    )}

                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4D0E12]">
                      Open archive
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 10h12m0 0l-4-4m4 4l-4 4" />
                      </svg>
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}