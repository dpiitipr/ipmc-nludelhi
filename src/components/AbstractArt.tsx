import React from 'react';

/*
  Abstract artwork built from the five brand swatches only:
  #F5EFC6 Transparent Yellow · #4D0E12 Sceptre Red · #A5BCD6 Cerulean Blue
  #4A2E27 Potting Soil · #231815 Java Brown

  Pillars, a sun disc and a layered doorway arch. Pure SVG, so it stays sharp at any size.
  It fills whatever box you give it (preserveAspectRatio "slice"), so use it like an image:
  <div className="relative h-80 overflow-hidden rounded-2xl"><AbstractArt className="absolute inset-0 h-full w-full" /></div>
*/

export default function AbstractArt({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="500" fill="#231815" />

      {/* pillars */}
      <rect x="0" y="120" width="70" height="380" fill="#4A2E27" />
      <rect x="80" y="205" width="64" height="295" fill="#4A2E27" opacity="0.65" />
      <rect x="330" y="60" width="70" height="440" fill="#4A2E27" />

      {/* sun disc with rings */}
      <circle cx="245" cy="185" r="125" fill="#4D0E12" />
      {[145, 165, 185, 205].map((r, i) => (
        <circle
          key={r}
          cx="245"
          cy="185"
          r={r}
          fill="none"
          stroke="#F5EFC6"
          strokeOpacity={0.36 - i * 0.08}
          strokeWidth="1.5"
        />
      ))}

      {/* layered doorway */}
      <path d="M95 500V330a95 95 0 0 1 190 0V500Z" fill="#A5BCD6" />
      <path d="M130 500V335a60 60 0 0 1 120 0V500Z" fill="#F5EFC6" opacity="0.92" />
      <path d="M160 500V340a30 30 0 0 1 60 0V500Z" fill="#231815" />

      {/* small disc */}
      <circle cx="322" cy="398" r="30" fill="#F5EFC6" />
      <circle cx="322" cy="398" r="12" fill="#4D0E12" />

      {/* hairlines */}
      <g stroke="#A5BCD6" strokeOpacity="0.35" strokeWidth="1.2">
        <line x1="0" y1="470" x2="400" y2="470" />
        <line x1="0" y1="40" x2="400" y2="40" />
        <line x1="40" y1="0" x2="40" y2="500" />
      </g>

      {/* dot grid */}
      <g fill="#F5EFC6" fillOpacity="0.55">
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => (
            <circle key={`${row}-${col}`} cx={70 + col * 16} cy={70 + row * 16} r="2" />
          ))
        )}
      </g>
    </svg>
  );
}