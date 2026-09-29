'use client';

import React, { useState, useEffect } from 'react';

export const OFFICIAL_SCHEDULE = [
  {
    event: 'Commencement of Registration and Release of Moot Proposition & Rules',
    dateStr: '1st October, 2026',
    isoDate: '2026-10-01T17:00:00+05:30',
  },
  {
    event: 'Last Date for Seeking Clarifications on Moot Proposition & Rules',
    dateStr: '20th October, 2026',
    isoDate: '2026-10-20T23:59:59+05:30',
  },
  {
    event: 'Last Date of Registration',
    dateStr: '31st October, 2026',
    isoDate: '2026-10-31T23:59:59+05:30',
  },
  {
    event: 'Release of Clarifications',
    dateStr: '1st November, 2026',
    isoDate: '2026-11-01T17:00:00+05:30',
  },
  {
    event: 'Submission of Memorandum',
    dateStr: '30th November, 2026',
    isoDate: '2026-11-30T23:59:59+05:30',
  },
  {
    event: 'Penalty Appeals',
    dateStr: '5th–6th December, 2026',
    isoDate: '2026-12-05T00:00:00+05:30',
  },
  {
    event: 'Announcement of Shortlisted Teams',
    dateStr: '24th December, 2026',
    isoDate: '2026-12-24T17:00:00+05:30',
  },
  {
    event: 'Memorial Exchange',
    dateStr: '5th February, 2027',
    isoDate: '2027-02-05T10:00:00+05:30',
  },
  {
    event: "Registrations, Opening Ceremony & Researcher's Test",
    dateStr: '5th February, 2027',
    isoDate: '2027-02-05T14:00:00+05:30',
  },
  {
    event: 'Oral Rounds & Valedictory Ceremony',
    dateStr: '6th–7th February, 2027',
    isoDate: '2027-02-06T09:00:00+05:30',
  },
];

export default function MilestoneTicker() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      let targetIdx = OFFICIAL_SCHEDULE.findIndex(
        (m) => new Date(m.isoDate).getTime() > now
      );

      if (targetIdx === -1) {
        targetIdx = OFFICIAL_SCHEDULE.length - 1;
      }

      setActiveIdx(targetIdx);

      const targetTime = new Date(OFFICIAL_SCHEDULE[targetIdx].isoDate).getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: '00', hours: '00', mins: '00', secs: '00' });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0'),
        secs: Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const current = OFFICIAL_SCHEDULE[activeIdx];

  return (
    <div className="bg-[#0A192F] text-[#FFFDF7] py-2.5 px-4 sm:px-8 font-mono text-[11px] border-b border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        
        {/* Active Milestone Display */}
        <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          <span className="w-2 h-2 rounded-full bg-[#8B0000] animate-pulse shrink-0" />
          <span className="text-[#D4AF37] font-bold uppercase tracking-widest shrink-0">NEXT DEADLINE:</span>
          <span className="text-white font-medium truncate">{current.event}</span>
          <span className="text-white/40 font-mono text-[10px] hidden lg:inline">({current.dateStr})</span>
        </div>

        {/* Live Countdown Runner */}
        <div className="flex items-center gap-3 tracking-wider font-bold shrink-0">
          <span>{timeLeft.days}<span className="text-[#D4AF37] font-normal text-[9px] ml-0.5">D</span></span>
          <span className="text-white/20">:</span>
          <span>{timeLeft.hours}<span className="text-[#D4AF37] font-normal text-[9px] ml-0.5">H</span></span>
          <span className="text-white/20">:</span>
          <span>{timeLeft.mins}<span className="text-[#D4AF37] font-normal text-[9px] ml-0.5">M</span></span>
          <span className="text-white/20">:</span>
          <span className="text-[#D4AF37]">{timeLeft.secs}<span className="text-white/60 font-normal text-[9px] ml-0.5">S</span></span>
        </div>

      </div>
    </div>
  );
}