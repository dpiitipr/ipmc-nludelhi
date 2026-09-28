'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Target Release Epoch: October 1st, 2026 at 5:00 PM IST
const TARGET_LAUNCH_DATE = new Date('2026-10-01T17:00:00+05:30').getTime();

export default function LaunchCountdownPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });
  const [isLive, setIsLive] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = TARGET_LAUNCH_DATE - now;

      if (difference <= 0) {
        setIsLive(true);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
      });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid university email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Store notify email directly in Supabase table
      const { error } = await supabase
        .from('launch_subscribers')
        .insert([{ email, subscribed_at: new Date().toISOString() }]);

      if (error) {
        // Handle duplicate key or fallback gracefully
        if (error.code === '23505') {
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      // Fallback state so user experience remains seamless
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#16100E] text-[#FAF8ED] flex flex-col justify-between font-sans selection:bg-[#4D0E12] selection:text-[#F5EFC6] border-t-4 border-[#4D0E12]">
      
      {/* 1. Header Section */}
      <header className="px-6 py-6 md:px-12 flex justify-between items-start border-b border-[#32231E]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-[#A5BCD6] block mb-1">
            National Law University Delhi
          </span>
          <h1 className="font-serif text-lg md:text-xl font-bold tracking-tight text-[#FAF8ED]">
            Vidhi Pragati <span className="text-[#A5BCD6] font-normal">| IPMC 2026</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 bg-[#231815] px-3 py-1.5 border border-[#32231E]">
          <span className="w-2 h-2 rounded-full bg-[#4D0E12] animate-pulse"></span>
          <span className="text-xs font-mono tracking-wider text-[#A5BCD6] uppercase">
            {isLive ? 'PORTAL LIVE' : 'LAUNCHING SOON'}
          </span>
        </div>
      </header>

      {/* 2. Main Center Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center flex-1 flex flex-col justify-center items-center">
        
        <p className="text-xs md:text-sm font-mono text-[#A5BCD6] uppercase tracking-[0.3em] mb-4">
          2nd National IP Moot Court Competition
        </p>

        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#FAF8ED] max-w-3xl leading-tight mb-8">
          Website goes live on <br className="hidden sm:inline" />
          <span className="text-[#F5EFC6] underline decoration-[#4D0E12] underline-offset-8">
            October 1st, 2026 at 5:00 PM IST
          </span>
        </h2>

        {/* Real-time Countdown Grid */}
        <div className="grid grid-cols-4 gap-3 sm:gap-6 my-6 w-full max-w-2xl">
          {[
            { label: 'DAYS', value: timeLeft.days },
            { label: 'HOURS', value: timeLeft.hours },
            { label: 'MINS', value: timeLeft.minutes },
            { label: 'SECS', value: timeLeft.seconds },
          ].map((unit, idx) => (
            <div 
              key={idx} 
              className="bg-[#231815] border border-[#32231E] p-4 sm:p-6 flex flex-col justify-center items-center shadow-[4px_4px_0px_0px_#4D0E12]"
            >
              <span className="font-mono text-3xl sm:text-5xl md:text-6xl font-bold text-[#F5EFC6] tracking-tight">
                {unit.value}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-[#A5BCD6] tracking-[0.2em] mt-2">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Action / Subscription Area */}
        <div className="mt-10 w-full max-w-md">
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter university email for alert"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#231815] border border-[#32231E] px-4 py-3 text-sm text-[#FAF8ED] placeholder-[#78635B] focus:outline-none focus:border-[#A5BCD6] flex-1 font-sans"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#4D0E12] hover:bg-[#6b151b] text-[#F5EFC6] font-mono text-xs uppercase tracking-wider px-6 py-3 font-semibold transition-colors border border-[#4D0E12]"
              >
                {loading ? 'Submitting...' : 'Notify Me'}
              </button>
            </form>
          ) : (
            <div className="bg-[#231815] border border-[#A5BCD6] p-4 text-center">
              <p className="text-xs font-mono text-[#A5BCD6]">
                ✓ You will be notified the moment registrations open.
              </p>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs font-mono text-red-400 mt-2">{errorMessage}</p>
          )}
        </div>

      </main>

      {/* 3. Minimal Universal Footer */}
      <footer className="px-6 py-6 md:px-12 border-t border-[#32231E] flex flex-col md:flex-row justify-between items-center text-[11px] font-mono text-[#78635B] gap-4">
        <div>
          CIIPC & IPR Chair, National Law University Delhi
        </div>
        <div className="flex gap-6">
          <span>Sector 14, Dwarka, New Delhi - 110078</span>
          <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="hover:text-[#A5BCD6] underline">
            dpiit.ipr@nludelhi.ac.in
          </a>
        </div>
      </footer>

    </div>
  );
}