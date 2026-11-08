import React from 'react';
import Link from 'next/link';

/*
  Palette: Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

const SOCIALS: { name: string; href: string; icon: string }[] = [
  { name: 'Instagram', href: 'https://www.instagram.com/vidhipragatinlud_ipmc', icon: 'ig' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/vidhi-pragati-national-ip-moot-court-989204333', icon: 'in' },
];

const EXPLORE: [string, string][] = [
  ['Home', '/'],
  ['Clarifications', '/clarifications'],
  ['Past editions', '/past-editions'],
  ['Contact', '/contact'],
];

const ICONS: Record<string, React.ReactNode> = {
  ig: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  in: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9.75h4V21H3V9.75zM10 9.75h3.8v1.6h.06c.53-1 1.84-2.05 3.8-2.05 4.06 0 4.8 2.67 4.8 6.14V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4V9.75z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3zm-1.08 16.15h1.7L7.4 4.75H5.58l11.09 14.4z" />
    </svg>
  ),
  fb: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6H16.6V4.3C16.3 4.3 15.4 4.2 14.4 4.2c-2.3 0-3.9 1.4-3.9 4v2.3H8v3h2.5V21h3z" />
    </svg>
  ),
  yt: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M21.6 7.2a2.5 2.5 0 00-1.76-1.77C18.3 5 12 5 12 5s-6.3 0-7.84.43A2.5 2.5 0 002.4 7.2C2 8.76 2 12 2 12s0 3.24.4 4.8a2.5 2.5 0 001.76 1.77C5.7 19 12 19 12 19s6.3 0 7.84-.43a2.5 2.5 0 001.76-1.77C22 15.24 22 12 22 12s0-3.24-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  ),
};

export default function Footer() {
  const socials = SOCIALS.filter((s) => s.href && s.href !== '#');

  return (
    <footer className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-6 -z-10 select-none font-serif text-[clamp(8rem,22vw,20rem)] font-bold leading-none text-transparent"
        style={{ WebkitTextStroke: '1.5px rgba(165,188,214,0.18)' }}
      >
        2027
      </span>

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16">
        {/* top: brand + call to follow */}
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-[#F5EFC6]/15 pb-10">
          <div className="max-w-xl">
            <p className="font-serif text-4xl font-bold leading-tight sm:text-5xl">Vidhi Pragati</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#A5BCD6]">
              National IP Moot Court Competition
            </p>
            <p className="mt-5 text-justify leading-relaxed text-[#F5EFC6]/80 hyphens-auto">
              Organised by the DPIIT IPR Chair, National Law University Delhi, with DPIIT, Ministry of Commerce and
              Industry, and CIIPC.
            </p>
          </div>

          {socials.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5BCD6]">Follow us</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}
                      className="grid h-11 w-11 place-items-center rounded-full border border-[#F5EFC6]/30 transition hover:-translate-y-0.5 hover:border-[#A5BCD6] hover:bg-[#A5BCD6] hover:text-[#231815]"
                    >
                      {ICONS[s.icon]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* middle: links + contact */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label="Explore">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5BCD6]">Explore</h3>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="font-semibold text-[#F5EFC6]/90 underline-offset-4 transition hover:text-[#A5BCD6] hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5BCD6]">Teams</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#F5EFC6] px-4 py-2 text-sm font-bold text-[#231815] transition hover:bg-[#A5BCD6]">
                  Team login →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5BCD6]">Reach us</h3>
            <address className="mt-4 space-y-3 not-italic leading-relaxed text-[#F5EFC6]/90">
              <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="block break-all font-semibold underline-offset-4 hover:text-[#A5BCD6] hover:underline">
                dpiit.ipr@nludelhi.ac.in
              </a>
              <p>
                National Law University Delhi
                <br />Sector 14, Dwarka
                <br />New Delhi – 110078
              </p>
            </address>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5BCD6]">Find us</h3>
            <a
              href="https://maps.app.goo.gl/GGhfBWP7hnozhQG2A" target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:text-[#A5BCD6] hover:underline"
            >
              Open in Google Maps ↗
            </a>
            <p className="mt-3 text-sm text-[#F5EFC6]/70">Campus, Sector 14, Dwarka, New Delhi.</p>
          </div>
        </div>

        {/* bottom */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F5EFC6]/15 pt-6 text-sm text-[#F5EFC6]/65">
          <p>© {new Date().getFullYear()} National Law University Delhi. All rights reserved.</p>
          <p>DPIIT IPR Chair · CIIPC</p>
        </div>
      </div>
    </footer>
  );
}