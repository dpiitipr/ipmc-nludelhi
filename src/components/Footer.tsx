import React from 'react';
import Link from 'next/link';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

const links = [
  { label: 'About', href: '/about' },
  { label: 'Past editions', href: '/past-editions' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  const ring =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A5BCD6]';

  return (
    <footer className="relative z-10 border-t border-[#A5BCD6]/25 bg-[#231815] px-6 py-12 text-[#F5EFC6] sm:px-10 md:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        {/* Institution and address */}
        <div className="space-y-3">
          <p className="font-serif text-xl font-bold leading-snug">
            Vidhi Pragati
            <span className="block text-base font-normal italic text-[#F5EFC6]/80">
              National IP Moot Court Competition
            </span>
          </p>
          <address className="text-sm not-italic leading-relaxed text-[#F5EFC6]/80">
            National Law University Delhi
            <br />
            Sector 14, Dwarka, New Delhi — 110078
          </address>
        </div>

        {/* Links */}
        <nav aria-label="Footer">
          <p className="text-sm text-[#A5BCD6]">Explore</p>
          <ul className="mt-3 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-semibold transition-colors hover:text-[#A5BCD6] ${ring}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Email */}
        <div>
          <p className="text-sm text-[#A5BCD6]">Write to us</p>
          <a
            href="mailto:dpiit.ipr@nludelhi.ac.in"
            className={`mt-3 inline-block break-all text-sm font-semibold underline decoration-[#A5BCD6]/50 underline-offset-4 transition hover:decoration-[#F5EFC6] ${ring}`}
          >
            dpiit.ipr@nludelhi.ac.in
          </a>
        </div>
      </div>
    </footer>
  );
}