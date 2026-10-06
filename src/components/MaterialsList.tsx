import React from 'react';
import { fileLabel, type MaterialItem } from '@/lib/materials';

const ringLight =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';

export default function MaterialsList({ items }: { items: MaterialItem[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-[#231815]/15 bg-[#A5BCD6]/25">
      {items.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-col gap-3 border-b border-[#231815]/15 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <span className="min-w-0 font-serif text-base font-bold leading-snug sm:text-lg">
            {doc.title}
          </span>

          {doc.files.length === 0 ? (
            <span className="text-sm font-semibold text-[#231815]/55">Not available yet</span>
          ) : (
            <div className="flex shrink-0 flex-wrap gap-2">
              {doc.files.map((f, idx) => {
                const label = fileLabel(f, idx, doc.files.length);
                return (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Download ${doc.title}${doc.files.length > 1 ? `, file ${label}` : ''}`}
                    className={`group inline-flex items-center gap-2 rounded-lg bg-[#4D0E12] px-3 py-2 text-sm font-semibold text-[#F5EFC6] transition hover:bg-[#231815] ${ringLight}`}
                  >
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-[#F5EFC6]/15 px-1.5 text-xs font-bold">
                      {f.type}
                    </span>
                    {label}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-4 w-4 transition group-hover:translate-y-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 17h12" />
                    </svg>
                  </a>
                );
              })}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}