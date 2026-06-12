'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function WidgetPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-08-29T12:00:00');

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center p-4 bg-[#030d1a] relative overflow-hidden select-none">
      {/* Dynamic Background Mesh Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#800020] rounded-full mix-blend-screen filter blur-2xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#C5A880] rounded-full mix-blend-screen filter blur-2xl opacity-35 animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[#001B3D]/80 backdrop-blur-3xl"></div>
      </div>

      {/* Widget Container */}
      <div className="relative z-10 w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-md rounded-[28px] p-6 text-white shadow-2xl flex flex-col justify-between aspect-square max-h-[320px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-[#800020] fill-[#800020] animate-pulse" />
            <h1 className="font-serif text-sm font-semibold tracking-wider text-white">L & V</h1>
          </div>
          <span className="text-[9px] uppercase tracking-widest font-semibold text-[#C5A880]">Casamento</span>
        </div>

        {/* Ticking Countdown digits */}
        <div className="grid grid-cols-4 gap-2 text-center my-auto">
          <div className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 backdrop-blur-sm">
            <span className="text-2xl font-serif text-[#C5A880] font-bold block">{timeLeft.days}</span>
            <span className="text-[7px] uppercase tracking-wider text-stone-400 block mt-0.5">Dias</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 backdrop-blur-sm">
            <span className="text-2xl font-serif text-[#C5A880] font-bold block">{timeLeft.hours}</span>
            <span className="text-[7px] uppercase tracking-wider text-stone-400 block mt-0.5">Horas</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 backdrop-blur-sm">
            <span className="text-2xl font-serif text-[#C5A880] font-bold block">{timeLeft.minutes}</span>
            <span className="text-[7px] uppercase tracking-wider text-stone-400 block mt-0.5">Minutos</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 backdrop-blur-sm">
            <span className="text-2xl font-serif text-[#C5A880] font-bold block">{timeLeft.seconds}</span>
            <span className="text-[7px] uppercase tracking-wider text-stone-400 block mt-0.5">Segundos</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 pt-3 text-center">
          <span className="text-[8px] uppercase tracking-widest text-stone-400 block">29 de Agosto de 2026</span>
          <span className="text-[9px] italic font-serif text-white/90 block mt-0.5">Lumiana & Vicente</span>
        </div>
      </div>
    </div>
  );
}
