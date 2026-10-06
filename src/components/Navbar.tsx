'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

const links = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Schedule', href: '/#schedule' },
  { label: 'Materials', href: '/#materials' },
  { label: 'Clarifications', href: '/clarifications' },
  { label: 'Past editions', href: '/past-editions' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Only real routes can be "current"; hash links point at sections on the home page.
  const isCurrent = (href: string) => {
    if (href.includes('#')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const ring =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A5BCD6]';

  return (
    <header className="sticky top-0 z-100 border-b border-[#A5BCD6]/25 bg-[#231815]/95 text-[#F5EFC6] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 sm:px-10 md:px-16">
        {/* Logo and institution */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`group flex items-center gap-4 ${ring}`}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#F5EFC6] p-1.5 ring-1 ring-[#A5BCD6]/50 transition group-hover:ring-2 group-hover:ring-[#A5BCD6] sm:h-14 sm:w-14">
            <Image
              alt="Vidhi Pragati logo"
              src="/vidhi_logo.PNG"
              width={56}
              height={56}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="text-left leading-tight">
            <span className="block text-sm font-bold sm:text-base">
              National Law University Delhi
            </span>
            <span className="mt-0.5 block text-xs text-[#A5BCD6] sm:text-sm">
              CIIPC &amp; DPIIT-IPR Chair
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden items-center gap-6 xl:flex">
          {links.map((link) => {
            const current = isCurrent(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={`border-b-2 pb-1 text-sm font-semibold transition-colors ${ring} ${
                  current
                    ? 'border-[#A5BCD6] text-[#F5EFC6]'
                    : 'border-transparent text-[#F5EFC6]/75 hover:border-[#A5BCD6]/60 hover:text-[#F5EFC6]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/register"
            aria-current={isCurrent('/register') ? 'page' : undefined}
            className={`rounded-full bg-[#F5EFC6] px-5 py-2 text-sm font-bold text-[#231815] transition hover:bg-[#A5BCD6] ${ring}`}
          >
            Register
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#A5BCD6]/40 transition hover:border-[#A5BCD6] xl:hidden ${ring}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-[#A5BCD6]/25 bg-[#231815] px-6 pb-5 pt-2 xl:hidden"
        >
          <ul className="divide-y divide-[#A5BCD6]/15">
            {links.map((link) => {
              const current = isCurrent(link.href);
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center justify-between py-3.5 text-base font-semibold ${ring} ${
                      current ? 'text-[#A5BCD6]' : 'text-[#F5EFC6]'
                    }`}
                  >
                    {link.label}
                    {current && (
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#A5BCD6]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            aria-current={isCurrent('/register') ? 'page' : undefined}
            className={`mt-4 flex items-center justify-center rounded-full bg-[#F5EFC6] px-6 py-3 text-base font-bold text-[#231815] transition hover:bg-[#A5BCD6] ${ring}`}
          >
            Register
          </Link>
        </nav>
      )}
    </header>
  );
}