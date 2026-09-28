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

  // Background Slideshow Carousel (Rotates every 5 seconds)
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BACKGROUND_SLIDES.length);
    }, 5000);
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
    <div className="relative min-h-screen bg-[#231815] text-[#F5EFC6] font-serif flex flex-col justify-between p-8 sm:p-14 md:p-18 overflow-hidden selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      
      {/* Background Photo Carousel with Soft Java Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {BACKGROUND_SLIDES.map((slideSrc, index) => (
          <div
            key={slideSrc}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-30 scale-105' : 'opacity-0 scale-100'
            } transition-transform duration-[8000ms]`}
          >
            <Image
              src={slideSrc}
              alt="Vidhi Pragati Competition Highlight"
              fill
              priority={index === 0}
              className="object-cover object-center"
            />
          </div>
        ))}

        {/* Java Dark Vignette Overlay for Crisp Readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 35%, rgba(35,24,21,0.70) 0%, rgba(35,24,21,0.95) 85%)'
          }}
        />
      </div>

      {/* Top Header & Logo */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* Logo Badge in Cream Palette Container */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-[#F5EFC6] p-2.5 shadow-xl border border-[#F5EFC6]/30 flex items-center justify-center">
            <Image
              src="/logo-trans.png"
              alt="Vidhi Pragati Logo"
              width={72}
              height={72}
              className="object-contain w-full h-full"
              priority
            />
          </div>

          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[#A5BCD6] block font-semibold">
              National Law University Delhi
            </span>
            <span className="text-xs font-mono tracking-wider text-[#F5EFC6]/70 uppercase block mt-0.5">
              CIIPC &amp; DPIIT-IPR Chair
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Section & Time Runner */}
      <main className="relative z-10 my-auto py-10 max-w-5xl">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-[#A5BCD6] mb-3 font-semibold">
          3rd National IP Moot Court Competition
        </p>

        <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif text-[#F5EFC6] leading-[0.9] tracking-tight font-normal">
          Vidhi Pragati <span className="italic font-light text-[#A5BCD6]">2027</span>
        </h1>

        <p className="text-xl sm:text-2xl md:text-3xl font-serif italic text-[#A5BCD6] mt-4 font-light">
          Competition Launch
        </p>

        {/* Time Runner Display */}
        <div className="mt-14 flex flex-wrap items-baseline gap-6 sm:gap-12 font-mono">
          <div className="flex flex-col">
            <span className="text-5xl sm:text-7xl md:text-8xl font-bold text-[#F5EFC6] tracking-tighter">
              {timeLeft.days}
            </span>
            <span className="text-[10px] tracking-[0.3em] text-[#A5BCD6] uppercase mt-2 font-semibold">
              Days
            </span>
          </div>

          <span className="text-3xl sm:text-5xl text-[#F5EFC6]/30 font-light select-none">:</span>

          <div className="flex flex-col">
            <span className="text-5xl sm:text-7xl md:text-8xl font-bold text-[#F5EFC6] tracking-tighter">
              {timeLeft.hours}
            </span>
            <span className="text-[10px] tracking-[0.3em] text-[#A5BCD6] uppercase mt-2 font-semibold">
              Hours
            </span>
          </div>

          <span className="text-3xl sm:text-5xl text-[#F5EFC6]/30 font-light select-none">:</span>

          <div className="flex flex-col">
            <span className="text-5xl sm:text-7xl md:text-8xl font-bold text-[#F5EFC6] tracking-tighter">
              {timeLeft.minutes}
            </span>
            <span className="text-[10px] tracking-[0.3em] text-[#A5BCD6] uppercase mt-2 font-semibold">
              Minutes
            </span>
          </div>

          <span className="text-3xl sm:text-5xl text-[#F5EFC6]/30 font-light select-none">:</span>

          <div className="flex flex-col">
            <span className="text-5xl sm:text-7xl md:text-8xl font-bold text-[#F5EFC6] tracking-tighter">
              {timeLeft.seconds}
            </span>
            <span className="text-[10px] tracking-[0.3em] text-[#A5BCD6] uppercase mt-2 font-semibold">
              Seconds
            </span>
          </div>
        </div>

        {/* Minimal Dispatch Form */}
        <div className="mt-14 max-w-md">
          <p className="text-xs font-mono text-[#A5BCD6] tracking-widest uppercase mb-4 font-semibold">
            Official Launch: October 01, 2026 - 17:00 IST
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex items-center border-b-2 border-[#F5EFC6]/30 pb-2 transition-colors focus-within:border-[#F5EFC6]">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs font-mono text-[#F5EFC6] placeholder-[#A5BCD6]/60 focus:outline-none flex-1 pr-4"
              />
              <button
                type="submit"
                disabled={loading}
                className="text-[11px] font-mono text-[#F5EFC6] hover:text-[#A5BCD6] uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer shrink-0"
              >
                {loading ? '...' : 'Notify Me →'}
              </button>
            </form>
          ) : (
            <p className="text-xs font-mono text-[#F5EFC6] tracking-widest uppercase font-semibold">
              ✓ Email Registered for Notification
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-[#A5BCD6] gap-4 pt-6 border-t border-[#F5EFC6]/15">
        <p className="font-medium">Sector 14, Dwarka, New Delhi — 110078</p>
        
        {/* Slideshow Progress Dots */}
        <div className="flex items-center gap-1.5">
          {BACKGROUND_SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-6 bg-[#F5EFC6]' : 'w-1.5 bg-[#F5EFC6]/20'
              }`}
            />
          ))}
        </div>

        <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="hover:text-[#F5EFC6] transition-colors font-medium">
          dpiit.ipr@nludelhi.ac.in
        </a>
      </footer>

    </div>
  );
}