'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { hygraphClient } from '@/lib/hygraph';
import { GET_VIDHI_CONTENT } from '@/lib/queries';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

export default function SingleEditionPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [edition, setEdition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const createSlug = (editionStr: string, fallbackId: string) => {
    if (!editionStr) return fallbackId;
    return editionStr.toLowerCase().trim().replace(/\s+/g, '-');
  };

  useEffect(() => {
    async function fetchData() {
      try {
        if (!slug) return;

        const allData: any = await hygraphClient.request(GET_VIDHI_CONTENT);
        const editions = allData?.pastEditions || [];

        const found = editions.find(
          (e: any) =>
            createSlug(e.edition, e.id) === slug ||
            e.id === slug ||
            e.edition?.toLowerCase().includes(slug.replace('-edition', ''))
        );

        if (found) {
          setEdition(found);
        } else {
          const isFirst = slug.includes('1st');
          setEdition({
            id: slug,
            title: isFirst
              ? '1st Vidhi Pragati National IP Moot Court Competition'
              : '2nd Vidhi Pragati National IP Moot Court Competition',
            edition: isFirst ? '1st Edition' : '2nd Edition',
            year: isFirst ? '2023' : '2024',
            theme: isFirst
              ? 'Emerging Issues in Patent & Trade Secrets'
              : 'Trademark and Copyright Jurisprudence',
            description: isFirst
              ? 'Inaugural edition of the Vidhi Pragati National IP Moot Court Competition hosted by National Law University Delhi.'
              : 'The 2nd edition brought together premier law schools across India to deliberate on trademark infringement in digital marketplaces, intermediary liability, and copyright ownership in AI-generated artistic works.',
            finalVideoUrl: '',
            valedictoryVideoUrl: '',
            materials: [],
            organisingCommitteePhotos: [
              {
                id: 'oc1',
                url: isFirst ? '/2A3A0323.JPG' : '/SAN_1069.JPG',
                fileName: '',
              },
            ],
          });
        }
      } catch (err) {
        console.error('Hygraph Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube-nocookie.com/embed/')) return url;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube-nocookie.com/embed/${match[2]}?rel=0`;
    }

    return url;
  };

  const ringLight =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';
  const ringDark =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A5BCD6]';

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFC6]" aria-busy="true">
        <div className="h-105 bg-[#231815]" />
        <div className="mx-auto max-w-5xl space-y-4 px-6 py-12">
          <div className="h-4 w-24 animate-pulse rounded bg-[#231815]/10" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-[#231815]/10" />
          <div className="h-4 w-4/5 max-w-xl animate-pulse rounded bg-[#231815]/10" />
        </div>
      </div>
    );
  }

  /* ---------- NOT FOUND ---------- */
  if (!edition) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5EFC6] px-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#231815]">
          We couldn&apos;t find that edition
        </h1>
        <p className="max-w-sm text-sm text-[#231815]/70">
          The link may be out of date. Browse all past editions instead.
        </p>
        <Link
          href="/past-editions"
          className={`rounded-full bg-[#4D0E12] px-6 py-2.5 text-sm font-semibold text-[#F5EFC6] transition hover:bg-[#231815] ${ringLight}`}
        >
          View past editions
        </Link>
      </div>
    );
  }

  const materialsList = (edition.materials || []).map((m: any, i: number) => {
    const fileObj = m.file || (m.url ? m : null);
    return {
      id: m.id || `material-${i}`,
      title: m.title || fileObj?.fileName || 'Document',
      fileUrl: fileObj?.url || m.url || '#',
      fileType: (fileObj?.mimeType || m.mimeType || '').includes('/')
        ? (fileObj?.mimeType || m.mimeType).split('/')[1].toUpperCase()
        : 'PDF',
    };
  });

  const ocPhotos = edition.organisingCommitteePhotos || [];
  const finalEmbed = getYouTubeEmbedUrl(edition.finalVideoUrl);
  const valedictoryEmbed = getYouTubeEmbedUrl(edition.valedictoryVideoUrl);

  // "1st Edition" -> "1st"
  const ordinal = (edition.edition || '').split(' ')[0];
  const heroPhoto = ocPhotos[0]?.url;

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        {heroPhoto && (
          <Image
            src={heroPhoto}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#231815] via-[#4D0E12]/60 to-[#231815]/50" />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 bottom-[-0.18em] -z-10 select-none font-serif text-[clamp(10rem,32vw,26rem)] font-bold leading-none text-transparent"
          style={{ WebkitTextStroke: '1.5px rgba(165,188,214,0.3)' }}
        >
          {ordinal}
        </span>

        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32 sm:pb-28 sm:pt-40">
          <Link
            href="/past-editions"
            className={`inline-flex items-center gap-2 rounded-full border border-[#F5EFC6]/30 px-4 py-1.5 text-sm text-[#F5EFC6]/85 transition hover:border-[#A5BCD6] hover:text-[#A5BCD6] ${ringDark}`}
          >
            <span aria-hidden="true">←</span> Past editions
          </Link>

          <h1 className="mt-8 max-w-3xl font-serif text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            {edition.title}
          </h1>

          {edition.theme && (
            <p className="mt-6 max-w-2xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/90 sm:text-xl">
              {edition.theme}
            </p>
          )}
        </div>
      </header>

      {/* ---------- FACT STRIP ---------- */}
      <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-6">
        <dl className="grid grid-cols-2 divide-x divide-[#F5EFC6]/15 rounded-xl border border-[#A5BCD6]/40 bg-[#4A2E27] text-[#F5EFC6] shadow-[0_14px_40px_-14px_rgba(35,24,21,0.7)] sm:grid-cols-3">
          <div className="px-5 py-4 sm:px-8 sm:py-5">
            <dt className="text-xs text-[#A5BCD6]">Edition</dt>
            <dd className="mt-0.5 font-serif text-lg font-bold sm:text-xl">{edition.edition}</dd>
          </div>
          <div className="px-5 py-4 sm:px-8 sm:py-5">
            <dt className="text-xs text-[#A5BCD6]">Year</dt>
            <dd className="mt-0.5 font-serif text-lg font-bold sm:text-xl">{edition.year}</dd>
          </div>
          <div className="col-span-2 border-t border-[#F5EFC6]/15 px-5 py-4 sm:col-span-1 sm:border-t-0 sm:px-8 sm:py-5">
            <dt className="text-xs text-[#A5BCD6]">Resources</dt>
            <dd className="mt-0.5 font-serif text-lg font-bold sm:text-xl">
              {materialsList.length} document{materialsList.length === 1 ? '' : 's'}
              {finalEmbed || valedictoryEmbed ? ' + video' : ''}
            </dd>
          </div>
        </dl>
      </div>

      {/* ---------- BODY ---------- */}
      <main className="mx-auto max-w-5xl space-y-20 px-6 pb-28 pt-16">
        {edition.description && (
          <section aria-labelledby="overview-h" className="grid gap-6 md:grid-cols-[180px_1fr] md:gap-12">
            <h2 id="overview-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Overview
            </h2>
            <p className="max-w-[62ch] font-serif text-lg leading-[1.8] text-[#231815]/90 sm:text-xl">
              {edition.description}
            </p>
          </section>
        )}

        {(finalEmbed || valedictoryEmbed) && (
          <section aria-labelledby="rec-h" className="space-y-6">
            <h2 id="rec-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Recordings
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {finalEmbed && (
                <figure className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#231815] shadow-[0_22px_50px_-22px_rgba(35,24,21,0.6)] ring-1 ring-[#231815]/20">
                    <iframe
                      src={finalEmbed}
                      title={`${edition.title} - Final Round`}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <figcaption className="text-sm font-semibold">Final round</figcaption>
                </figure>
              )}

              {valedictoryEmbed && (
                <figure className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#231815] shadow-[0_22px_50px_-22px_rgba(35,24,21,0.6)] ring-1 ring-[#231815]/20">
                    <iframe
                      src={valedictoryEmbed}
                      title={`${edition.title} - Valedictory Session`}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <figcaption className="text-sm font-semibold">Valedictory session</figcaption>
                </figure>
              )}
            </div>
          </section>
        )}

        {materialsList.length > 0 && (
          <section aria-labelledby="mat-h" className="space-y-6">
            <h2 id="mat-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Materials and documents
            </h2>

            <ul className="overflow-hidden rounded-2xl border border-[#231815]/15 bg-[#A5BCD6]/25">
              {materialsList.map((doc: any) => (
                <li key={doc.id} className="border-b border-[#231815]/15 last:border-b-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#A5BCD6]/50 sm:px-6 ${ringLight} focus-visible:-outline-offset-2`}
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#4D0E12] text-xs font-bold text-[#F5EFC6]">
                        {doc.fileType.slice(0, 4)}
                      </span>
                      <span className="truncate font-serif text-base font-bold sm:text-lg">
                        {doc.title}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#4D0E12]">
                      <span className="hidden sm:inline">Download</span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-5 w-5 transition group-hover:translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 17h12" />
                      </svg>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {ocPhotos.length > 0 && (
          <section aria-labelledby="oc-h" className="space-y-6">
            <h2 id="oc-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Organising committee
            </h2>

            <div className={`grid gap-6 ${ocPhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {ocPhotos.map((photo: any) => (
                <div
                  key={photo.id}
                  className={`relative w-full overflow-hidden rounded-2xl bg-[#A5BCD6]/30 ring-1 ring-[#231815]/15 ${
                    ocPhotos.length === 1 ? 'aspect-video' : 'aspect-4/3'
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={`Organising committee, ${edition.edition}`}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="border-t border-[#231815]/20 pt-10">
          <Link
            href="/past-editions"
            className={`inline-flex items-center gap-2 rounded-full bg-[#4D0E12] px-6 py-2.5 text-sm font-semibold text-[#F5EFC6] transition hover:bg-[#231815] ${ringLight}`}
          >
            <span aria-hidden="true">←</span> All past editions
          </Link>
        </div>
      </main>
    </div>
  );
}