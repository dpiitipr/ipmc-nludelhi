'use client';

import React from 'react';
import Image from 'next/image';

const ORGANISERS = [
  {
    name: 'DPIIT-IPR Chair',
    role: 'Intellectual Property Asset Management (IPAM)',
    logo: '/ipam-logo.png',
    link: 'https://nludelhi.ac.in/dpiit-ipr-chair/',
  },
  {
    name: 'DPIIT',
    role: 'Department for Promotion of Industry and Internal Trade',
    logo: '/dtiip-logo.png',
    link: 'https://www.dpiit.gov.in/',
  },
  {
    name: 'NLU Delhi',
    role: 'National Law University Delhi',
    logo: '/nlud-logo.png',
    link: 'https://nludelhi.ac.in/',
  },
  {
    name: 'CIIPC',
    role: 'Centre for Innovation, IP & Competition',
    logo: '/ciipc-logo.png',
    link: 'https://nludelhi.ac.in/research/centre-for-innovation-intellectual-property-and-competition-ciipc/',
  },
];

export default function OrganisersSection() {
  return (
    <section id="organisers" className="py-12 px-6 max-w-6xl mx-auto text-center">
      <div className="mb-10">
        <span className="text-xs font-mono tracking-[0.25em] text-[#8B0000] uppercase font-bold block mb-2">
          INSTITUTIONAL PARTNERS &amp; CHAIRS
        </span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0A192F]">
          Organised By
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-stretch">
        {ORGANISERS.map((org, idx) => (
          <a
            key={idx}
            href={org.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#0A192F]/10 shadow-sm hover:border-[#8B0000] hover:shadow-md transition-all flex flex-col items-center justify-between text-center"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 my-auto flex items-center justify-center p-2">
              <Image
                src={org.logo}
                alt={org.name}
                width={120}
                height={120}
                className="object-contain max-h-full w-auto grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
            
            <div className="mt-4 pt-3 border-t border-[#0A192F]/10 w-full">
              <h3 className="font-serif font-bold text-sm text-[#0A192F] group-hover:text-[#8B0000] transition-colors">
                {org.name}
              </h3>
              <p className="font-mono text-[10px] text-[#0A192F]/60 mt-1 line-clamp-2">
                {org.role}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}