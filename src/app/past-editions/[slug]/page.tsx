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

type ParsedVideo = { embedUrl: string; watchUrl: string };

// Understands watch, youtu.be, shorts, live, embed and playlist links, a bare video id,
// or a whole pasted <iframe ...> snippet. Returns null for anything that cannot be embedded.
const parseYouTube = (raw?: string | null): ParsedVideo | null => {
  if (!raw) return null;
  let value = String(raw).trim();
  if (!value) return null;

  const iframeSrc = value.match(/src=["']([^"']+)["']/i);
  if (iframeSrc) value = iframeSrc[1].trim();

  const fromId = (id: string): ParsedVideo => ({
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
  });

  if (/^[\w-]{11}$/.test(value)) return fromId(value);

  if (value.startsWith('//')) value = `https:${value}`;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www|m|music)\./, '');
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = url.pathname.split('/')[1] || null;
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v');
      } else {
        const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
        id = m ? m[1] : null;
      }

      const list = url.searchParams.get('list');
      if (!id && list) {
        return {
          embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`,
          watchUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`,
        };
      }
    }

    if (id && /^[\w-]{11}$/.test(id)) return fromId(id);
  } catch {
    /* fall through */
  }
  return null;
};

const asHttpUrl = (raw?: string | null) => {
  const v = String(raw ?? '').trim();
  return /^https?:\/\//i.test(v) ? v : null;
};

// Finds a file URL on a material whatever the field is called:
// m.file.url, m.url, m.document.url, or a plain URL string.
const findFileUrl = (m: any): { url: string | null; mime: string; name: string } => {
  const candidates = [m?.file, m?.document, m?.pdf, m?.asset, m];
  for (const c of candidates) {
    if (c && typeof c === 'object' && typeof c.url === 'string' && c.url.trim()) {
      return { url: c.url.trim(), mime: c.mimeType || '', name: c.fileName || '' };
    }
  }
  for (const val of Object.values(m || {})) {
    if (val && typeof val === 'object' && typeof (val as any).url === 'string') {
      const o = val as any;
      return { url: o.url.trim(), mime: o.mimeType || '', name: o.fileName || '' };
    }
    if (typeof val === 'string' && /^https?:\/\//i.test(val.trim())) {
      return { url: val.trim(), mime: '', name: '' };
    }
  }
  return { url: null, mime: '', name: '' };
};

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
          let merged = found;

          // The shared query may not select the video fields at all: ask for them directly.
          if (found.finalVideoUrl === undefined && found.valedictoryVideoUrl === undefined) {
            try {
              const v: any = await hygraphClient.request(
                `query EditionVideos { pastEditions { id finalVideoUrl valedictoryVideoUrl } }`
              );
              const match = v?.pastEditions?.find((x: any) => x.id === found.id);
              if (match) merged = { ...merged, ...match };
            } catch (err) {
              console.warn(
                'Could not read finalVideoUrl / valedictoryVideoUrl from Hygraph. Check the field API IDs on the past edition model.',
                err
              );
            }
          }

          // Same for materials: if none of them came back with a file link,
          // ask for the file field directly.
          const mats: any[] = Array.isArray(merged.materials) ? merged.materials : [];
          const hasAnyLink = mats.some((m) => findFileUrl(m).url);
          if (!hasAnyLink) {
            try {
              const r: any = await hygraphClient.request(
                `query EditionMaterials { pastEditions { id materials { id title file { url fileName mimeType } } } }`
              );
              const match = r?.pastEditions?.find((x: any) => x.id === found.id);
              if (match?.materials?.length) merged = { ...merged, materials: match.materials };
            } catch (err) {
              console.warn(
                'Could not read materials.file from Hygraph. Check the API IDs of the materials field and its file field.',
                err
              );
            }
            console.log('materials from Hygraph:', merged.materials);
          }

          setEdition(merged);
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
    const f = findFileUrl(m);
    return {
      id: m.id || `material-${i}`,
      title: m.title || f.name || 'Document',
      fileUrl: f.url, // null when no link was found
      fileType: f.mime.includes('/') ? f.mime.split('/')[1].toUpperCase() : 'PDF',
    };
  });

  const ocPhotos = edition.organisingCommitteePhotos || [];
  const heroPhoto = ocPhotos[0]?.url;

  // Only recordings that actually have a link; each is parsed once
  const videos = [
    { key: 'final', label: 'Final round', raw: edition.finalVideoUrl },
    { key: 'valedictory', label: 'Valedictory session', raw: edition.valedictoryVideoUrl },
  ]
    .filter((v) => typeof v.raw === 'string' && v.raw.trim() !== '')
    .map((v) => ({ ...v, parsed: parseYouTube(v.raw), href: asHttpUrl(v.raw) }));

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

          {edition.year && (
            <p className="mt-4 text-base font-semibold text-[#A5BCD6]">{edition.year}</p>
          )}

          {edition.theme && (
            <p className="mt-6 max-w-2xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/90 sm:text-xl">
              {edition.theme}
            </p>
          )}
        </div>
      </header>

      {/* ---------- BODY ---------- */}
      <main className="mx-auto max-w-5xl space-y-20 px-6 pb-28 pt-16">
        {edition.description && (
          <section aria-labelledby="overview-h" className="grid gap-6 md:grid-cols-[180px_1fr] md:gap-12">
            <h2 id="overview-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Overview
            </h2>
            <p className="max-w-[62ch] text-justify font-serif text-lg leading-[1.8] text-[#231815]/90 hyphens-auto sm:text-xl">
              {edition.description}
            </p>
          </section>
        )}

        {videos.length > 0 && (
          <section aria-labelledby="rec-h" className="space-y-6">
            <h2 id="rec-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Recordings
            </h2>

            <div
              className={`grid grid-cols-1 gap-8 ${videos.length > 1 ? 'md:grid-cols-2' : 'max-w-3xl'}`}
            >
              {videos.map((v) => (
                <figure key={v.key} className="space-y-3">
                  {v.parsed ? (
                    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#231815] shadow-[0_22px_50px_-22px_rgba(35,24,21,0.6)] ring-1 ring-[#231815]/20">
                      <iframe
                        src={v.parsed.embedUrl}
                        title={`${edition.title} - ${v.label}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl bg-[#231815] p-6 text-center text-[#F5EFC6] ring-1 ring-[#231815]/20">
                      <p className="max-w-xs text-base">
                        This recording can&apos;t be shown on the page.
                      </p>
                      {v.href && (
                        <a
                          href={v.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`rounded-full bg-[#F5EFC6] px-5 py-2 text-sm font-bold text-[#231815] transition hover:bg-[#A5BCD6] ${ringDark}`}
                        >
                          Open the recording
                        </a>
                      )}
                    </div>
                  )}

                  <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{v.label}</span>
                    {v.parsed && (
                      <a
                        href={v.parsed.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-semibold text-[#4D0E12] underline underline-offset-4 ${ringLight}`}
                      >
                        Watch on YouTube
                      </a>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {materialsList.length > 0 && (
          <section aria-labelledby="mat-h" className="space-y-6">
            <h2 id="mat-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
              Materials and documents
            </h2>

            <ul className="overflow-hidden rounded-2xl border border-[#231815]/15 bg-[#A5BCD6]/25">
              {materialsList.map((doc: any) => {
                const inner = (
                  <>
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#4D0E12] text-xs font-bold text-[#F5EFC6]">
                        {doc.fileType.slice(0, 4)}
                      </span>
                      <span className="truncate font-serif text-base font-bold sm:text-lg">
                        {doc.title}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#4D0E12]">
                      {doc.fileUrl ? (
                        <>
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
                        </>
                      ) : (
                        <span className="text-[#231815]/55">Not available yet</span>
                      )}
                    </span>
                  </>
                );

                return (
                  <li key={doc.id} className="border-b border-[#231815]/15 last:border-b-0">
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#A5BCD6]/50 sm:px-6 ${ringLight} focus-visible:-outline-offset-2`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
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