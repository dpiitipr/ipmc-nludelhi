'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type Photo = { id?: string; url: string };

type Props = {
  photos: Photo[];
  alt: string;
  sizes: string;
  interval?: number;
  showDots?: boolean;
  pauseOnHover?: boolean;
  priority?: boolean;
  decorative?: boolean; // true for background use: hides images from screen readers
};

export default function PhotoSlideshow({
  photos,
  alt,
  sizes,
  interval = 4500,
  showDots = false,
  pauseOnHover = false,
  priority = false,
  decorative = false,
}: Props) {
  const slides = photos.filter((p) => p?.url);
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (count < 2 || paused) return;
    // respect "reduce motion" settings
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setActive((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, paused, interval]);

  if (count === 0) return null;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
    >
      {slides.map((p, i) => (
        <Image
          key={p.id ?? p.url}
          src={p.url}
          alt={decorative ? '' : `${alt} (${i + 1} of ${count})`}
          aria-hidden={decorative || i !== active}
          fill
          sizes={sizes}
          priority={priority && i === 0}
          className={`object-cover transition-opacity duration-1000 ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {showDots && count > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          {slides.map((p, i) => (
            <button
              key={p.id ?? p.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all ${
                i === active ? 'w-6 bg-[#F5EFC6]' : 'w-2 bg-[#F5EFC6]/50 hover:bg-[#F5EFC6]/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}