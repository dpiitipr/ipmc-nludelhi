'use client';

import React from 'react';

export interface ScheduleItem {
  event?: string;
  title?: string;
  dateStr?: string;
  date?: string;
  isoDate?: string;
}

interface ScheduleTableProps {
  schedule: ScheduleItem[];
}

export default function ScheduleTable({ schedule }: ScheduleTableProps) {
  if (!schedule || schedule.length === 0) return null;

  return (
    <section id="schedule" className="py-16 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-xs font-mono tracking-[0.25em] text-[#8B0000] uppercase font-bold block mb-2">
          COMPETITION TIMELINE
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#0A192F]">
          Official Schedule of Events
        </h2>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#0A192F]/15 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-serif text-sm">
            <thead className="bg-[#0A192F] text-[#FFFDF7] font-mono text-xs uppercase tracking-wider border-b border-[#D4AF37]/30">
              <tr>
                <th className="py-4 px-6 font-bold">Scheduled Event</th>
                <th className="py-4 px-6 font-bold text-right w-56 sm:w-64">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A192F]/10">
              {schedule.map((item: ScheduleItem, idx: number) => (
                <tr key={idx} className="hover:bg-[#FFFDF7] transition-colors">
                  <td className="py-4 px-6 text-[#0A192F] font-medium leading-relaxed">
                    {item.event || item.title}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs font-bold text-[#8B0000] text-right whitespace-nowrap">
                    {item.dateStr || item.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}