'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// Competition Photo Slideshow Assets
const BACKGROUND_SLIDES = [
  '/2A3A0323.JPG',
  '/2A3A9002.JPG',
  '/2A3A9270.JPG',
  '/2A3A9580.JPG',
  '/SAN_1069.JPG',
];

// Target Launch Epoch: October 1st, 2026 at 17:00 IST (For Vidhi Pragati 2027 - 3rd Edition)
const TARGET_LAUNCH_DATE = new Date('2026-10-01T17:00:00+05:30').getTime();

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Background Photo Slideshow (Rotates every 4.5 seconds)
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BACKGROUND_SLIDES.length);
    }, 4500);
    return () => clearInterval(slideInterval);
  }, []);

  // Countdown Timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = TARGET_LAUNCH_DATE - now;

      if (difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0'),
        seconds: Math.floor((difference % (1000 * 60)) / 1000).toString().padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('launch_subscribers')
        .insert([{ email, subscribed_at: new Date().toISOString() }]);

      if (error && error.code !== '23505') throw error;
      setSubscribed(true);
    } catch {
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFFDF7] text-[#0A192F] font-serif flex flex-col justify-between p-6 sm:p-10 md:p-16 border-t-[6px] border-[#8B0000] selection:bg-[#8B0000] selection:text-[#FFFDF7] overflow-x-hidden">
      
      {/* Full-Screen Background Photo Carousel with Soft Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {BACKGROUND_SLIDES.map((slideSrc, index) => (
          <div
            key={slideSrc}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-35 scale-100' : 'opacity-0 scale-105'
            } transition-transform duration-6000`}
          >
            <Image
              src={slideSrc}
              alt="Vidhi Pragati Background"
              fill
              priority={index === 0}
              className="object-cover object-center"
            />
          </div>
        ))}

        {/* Parchment Overlay Gradient for Central Focus */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,253,247,0.75) 0%, rgba(255,253,247,0.94) 80%)'
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b-2 border-[#0A192F]/15">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-white p-2 shadow-md border-2 border-[#D4AF37]/40 flex items-center justify-center">
            <Image
              src="/logo-trans.png"
              alt="Vidhi Pragati Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div className="text-left">
            <span className="text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#8B0000] font-bold block">
              National Law University Delhi
            </span>
            <span className="text-xs sm:text-sm font-mono tracking-wider text-[#0A192F]/80 uppercase block font-semibold mt-0.5">
              CIIPC &amp; DPIIT-IPR Chair
            </span>
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="relative z-10 my-auto py-8 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        
        {/* 1. 3rd National IP Moot Court Competition */}
        <div className="inline-block bg-[#8B0000]/10 border border-[#8B0000]/30 px-4 py-1.5 rounded-full mb-5">
          <span className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase text-[#8B0000] font-bold">
            3rd National IP Moot Court Competition
          </span>
        </div>

        {/* 2. Vidhi Pragati 2027 (Fixed sizing & line wrapping) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-[#0A192F] leading-none tracking-tight font-normal">
          Vidhi Pragati <span className="italic font-normal text-[#8B0000] whitespace-nowrap">2027</span>
        </h1>

        {/* 3. Launch of the Competition */}
        <p className="text-lg sm:text-2xl md:text-3xl font-serif italic text-[#0A192F]/80 mt-4 font-light">
          Launch of the Competition
        </p>

        {/* Unified Numerical Countdown Box Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl w-full my-8 sm:my-10">
          {[
            { label: 'DAYS', value: timeLeft.days },
            { label: 'HOURS', value: timeLeft.hours },
            { label: 'MINUTES', value: timeLeft.minutes },
            { label: 'SECONDS', value: timeLeft.seconds },
          ].map((item, i) => (
            <div 
              key={i} 
              className="bg-white/90 backdrop-blur-sm border-2 border-[#0A192F]/20 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center shadow-md hover:border-[#8B0000] transition-colors"
            >
              <span className="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold text-[#0A192F] tracking-tighter">
                {item.value}
              </span>
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#0A192F]/60 uppercase mt-2 font-bold">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* 4. OFFICIAL LAUNCH AT OCTOBER 01, 2026 — 17:00 IST */}
        <p className="text-xs sm:text-sm font-mono text-[#8B0000] tracking-[0.2em] uppercase font-bold mb-6">
          OFFICIAL LAUNCH AT OCTOBER 01, 2026 — 17:00 IST
        </p>

        {/* 5. Email Address Subscription Input */}
        <div className="w-full max-w-md">
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex items-center border-b-2 border-[#8B0000] pb-2 transition-colors focus-within:border-[#0A192F]">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-mono text-[#0A192F] placeholder-[#0A192F]/50 focus:outline-none flex-1 pr-3 text-center"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#8B0000] hover:bg-[#0A192F] text-[#FFFDF7] text-xs font-mono font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md"
              >
                {loading ? '...' : 'Notify Me →'}
              </button>
            </form>
          ) : (
            <div className="bg-[#8B0000]/10 border border-[#8B0000] p-3.5 rounded-xl text-center">
              <p className="text-xs font-mono text-[#8B0000] tracking-widest uppercase font-bold">
                ✓ Registered for Official Launch Dispatch
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-[#0A192F]/80 gap-3 pt-6 border-t-2 border-[#0A192F]/15">
        <p className="font-semibold">Sector 14, Dwarka, New Delhi — 110078</p>
        
        {/* Carousel Indicators */}
        <div className="flex items-center gap-1.5">
          {BACKGROUND_SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-6 bg-[#8B0000]' : 'w-2 bg-[#0A192F]/20'
              }`}
            />
          ))}
        </div>

        <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="hover:text-[#8B0000] transition-colors font-bold text-[#8B0000]">
          dpiit.ipr@nludelhi.ac.in
        </a>
      </footer>

    </div>
  );
}