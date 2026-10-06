'use client';

import React from 'react';
import Image from 'next/image';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

export default function AboutPage() {
  const organizers = [
    {
      name: 'Department for Promotion of Industry and Internal Trade',
      institution: 'DPIIT, Ministry of Commerce and Industry',
      logo: '/dtiip-logo.png',
      link: 'https://www.dpiit.gov.in/',
      description:
        'Established in 1995 to foster industrial growth in India. In 2000, it expanded its mandate through a merger with the Department of Industrial Development. Operating under the Ministry of Commerce and Industry, Government of India, DPIIT is instrumental in formulating and implementing policies that enhance the industrial sector. The department’s initiatives align with national priorities and socio-economic objectives, promoting sustainable and inclusive industrial growth that contributes to the overall development of India’s economy.',
    },
    {
      name: 'Cell for IPR Promotion and Management',
      institution: 'CIPAM, DPIIT, Ministry of Commerce and Industry',
      logo: '/ipam-logo.png',
      link: 'https://cipam.gov.in/',
      description:
        'Created in 2016 under the aegis of DPIIT, Ministry of Commerce and Industry, to take forward the implementation of the National IPR Policy. CIPAM works to build public awareness of intellectual property rights, to facilitate IP filings, and to give inventors a platform to commercialise their IP assets, in coordination with government ministries, departments and other stakeholders.',
    },
    {
      name: 'National Law University Delhi',
      institution: 'NLUD',
      logo: '/nlud-logo.png',
      link: 'https://nludelhi.ac.in/',
      description:
        'Established by Act 1 of 2008, NLUD aims to provide comprehensive and interdisciplinary legal education that is socially relevant. Its vision is to be a leading global institution, offering diverse opportunities for contributions to the legal profession. NLUD’s curriculum bridges theoretical concepts and practical applications, fostering innovation and a scientific mindset among students to drive future change. The notable achievements of its students and faculty highlight the university’s exceptional talent, and NLUD has consistently ranked 2nd in the Law Category of the National Institutional Ranking Framework (NIRF), Ministry of Education, Government of India.',
    },
    {
      name: 'The Chair on Intellectual Property Rights (IPR)',
      institution: 'National Law University Delhi',
      logo: '/NLU-Delhi-DPIIT-IPR-Chair.png',
      link: 'https://nludelhi.ac.in/dpiit-ipr-chair/',
      description:
        'Established by the DPIIT, Ministry of Commerce and Industry, in October 2018 to enhance IP education and research. It focuses on the intersection of IP law with public policy and international issues relevant to India. Guided by Dr. Yogesh Pai, the Chair undertakes a wide range of initiatives, including research on emerging IP areas and educational programs like L2Pro India. The Chair also organizes events to raise awareness among students, researchers, and practitioners, along with outreach activities to promote IP knowledge.',
    },
    {
      name: 'Centre for Innovation, Intellectual Property and Competition',
      institution: 'CIIPC, NLU Delhi',
      logo: '/ciipc-logo.png',
      link: 'https://nludelhi.ac.in/research/centre-for-innovation-intellectual-property-and-competition-ciipc/',
      description:
        'Established in 2015, CIIPC fosters dialogue and research on innovation, intellectual property (IP), and competition. It employs empirical and interdisciplinary methods to explore contemporary issues in the field of IP. CIIPC also plays a vital role in various educational initiatives, including its involvement in the LL.M. program in IP Administration and Legislations, an executive diploma program tailored for officials of the CGPDTM and WIPO-NLUD-IPO Joint Masters/LL.M. in IP Law and Management Programme. Additionally, CIIPC hosts workshops, conferences, and courses to build capacity and facilitate discussions among scholars and industry professionals, attracting renowned experts and enthusiastic attendees from India and the Asia-Pacific region.',
    },
  ];

  const people = [
    {
      name: 'Prof. G. S. Bajpai',
      role: 'Patron-in-Chief',
      detail: 'Vice-Chancellor, National Law University Delhi',
      photo: '/prof-g-s-bajpai-VC-NLUD.jpg',
    },
    {
      name: 'Amardeep Singh Bhatia',
      role: 'Patron-in-Chief',
      detail: 'Secretary, Department for Promotion of Industry and Internal Trade',
      photo: '/Amardeep%20Singh%20Bhatia.png',
    },
    {
      name: 'Risham Garg',
      role: 'Patron',
      detail: 'Registrar, National Law University Delhi',
      photo: '/Risham-Garg.jpg',
    },
    {
      name: 'Nishtha Sharma',
      role: 'Moot Director',
      detail: 'Research and Programme Coordinator, National Law University Delhi',
      photo: '/Nishtha%20Sharma.JPG',
    },
  ];

  const ringLight =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4D0E12]';
  const ringDark =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A5BCD6]';

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-32 sm:pb-24 sm:pt-40 md:grid-cols-[1fr_auto] md:gap-16">
          <div>
            <h1 className="mt-6 font-serif text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
              About the
              <br />
              competition
            </h1>
          </div>

          {/* Logo sits on a light tile so the artwork stays legible */}
          <div className="relative order-first h-32 w-32 overflow-hidden rounded-3xl bg-[#F5EFC6] ring-2 ring-[#A5BCD6]/60 sm:h-44 sm:w-44 md:order-0">
            <Image
              src="/vidhi_logo.PNG"
              alt="Vidhi Pragati IPMC official logo"
              fill
              priority
              sizes="176px"
              className="object-contain p-3"
            />
          </div>
        </div>
      </header>

      {/* ---------- OVERVIEW ---------- */}
      <section className="mx-auto w-full max-w-3xl px-6 py-24">

        <div className="space-y-6 font-serif text-lg leading-[1.85] text-[#231815]/90 sm:text-xl">
          <p className="text-justify hyphens-auto">
            The Centre for Innovation, Intellectual Property and Competition as well as IPR Chair at National Law University Delhi in collaboration with Department for Promotion of Industry and Internal Trade (DPIIT), Ministry of Commerce and Industry is extremely proud to announce the much anticipated 2nd edition of its prestigious <strong className="text-[#231815]">Vidhi Pragati: National IP Moot Court Competition</strong>. This competition is designed for participants to increase their advocacy skills, work on contemporary legal issues, and gain comprehensive knowledge of Intellectual Property Laws, its enforcement, and the latest case laws.
          </p>
          <p className="text-justify hyphens-auto">
            The first edition of the competition saw participation from premier law schools throughout the country. In the 2nd edition, this competition continues its mission to provide a premier platform for law students across India to explore cutting-edge questions in intellectual property law. The theme of this edition is <strong className="text-[#4D0E12]">“Trademark and Copyright”</strong>, and the unique moot proposition will invite participants to deliberate over finer concepts of trademark and copyright in the contemporary world.
          </p>
        </div>
      </section>

      {/* ---------- PATRONS AND MOOT DIRECTOR ---------- */}
      <section className="w-full bg-[#A5BCD6] px-6 py-24">
        <div className="mx-auto max-w-6xl space-y-12">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#231815] sm:text-5xl">
            Patrons and Moot Director
          </h2>

          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {people.map((p) => (
              <li key={p.name}>
                <figure>
                  <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-[#F5EFC6] ring-1 ring-[#231815]/20">
                    <Image
                      src={p.photo}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <figcaption className="mt-4">
                    <span className="block text-sm font-bold text-[#4D0E12]">{p.role}</span>
                    <span className="mt-1 block font-serif text-xl font-bold leading-snug text-[#231815]">
                      {p.name}
                    </span>
                    {p.detail && (
                      <span className="mt-1 block text-sm leading-snug text-[#231815]/75">
                        {p.detail}
                      </span>
                    )}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- ORGANIZERS ---------- */}
      <section className="w-full bg-[#231815] px-6 py-24 text-[#F5EFC6]">
        <div className="mx-auto max-w-5xl space-y-14">
          <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            About the organizers
          </h2>

          <ul className="divide-y divide-[#A5BCD6]/25 border-y border-[#A5BCD6]/25">
            {organizers.map((org) => (
              <li
                key={org.name}
                className="grid gap-6 py-10 md:grid-cols-[170px_1fr] md:gap-12 md:py-12"
              >
                <div className="flex h-24 w-40 items-center justify-center self-start rounded-2xl bg-[#F5EFC6] p-3">
                  <Image
                    src={org.logo}
                    alt={`${org.name} logo`}
                    width={120}
                    height={72}
                    className="max-h-16 w-auto object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-xl text-[#A5BCD6] font-bold leading-snug sm:text-2xl">
                      {org.name}
                    </h3>
                  </div>

                  <p className="max-w-[66ch] text-justify text-base leading-relaxed text-[#F5EFC6]/85 hyphens-auto">
                    {org.description}
                  </p>

                  <a
                    href={org.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group inline-flex items-center gap-2 text-sm font-semibold text-[#A5BCD6] transition-colors hover:text-[#F5EFC6] ${ringDark}`}
                  >
                    Visit website
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
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}