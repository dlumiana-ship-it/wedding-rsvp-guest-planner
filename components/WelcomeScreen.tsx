'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Calendar, ArrowRight } from 'lucide-react';

interface Companion {
  name: string;
}

interface Guest {
  id: string;
  name: string;
  vip: boolean;
  companions?: Companion[];
}

interface WelcomeScreenProps {
  guest: Guest;
  onEnter: () => void;
  heroPhoto: string;
}

export default function WelcomeScreen({ guest, onEnter, heroPhoto }: WelcomeScreenProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const partner = guest.companions?.[0]?.name;
  const firstName = partner 
    ? `${guest.name.split(' ')[0]} & ${partner.split(' ')[0]}` 
    : guest.name.split(' ')[0];

  useEffect(() => {
    const targetDate = new Date('2026-09-12T12:00:00');
    
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-950 px-4">
      {/* Background Image with Dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroPhoto}
          alt="Lumiana & Vicente"
          className="w-full h-full object-cover filter brightness-[0.3] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-stone-950/80" />
      </div>

      {/* Elegant floating blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-wedding-gold rounded-full filter blur-[100px] animate-blob" />
        <div className="absolute -bottom-45 right-10 w-96 h-96 bg-wedding-burgundy rounded-full filter blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-xl text-center flex flex-col items-center"
      >
        {/* Monogram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8 border border-wedding-gold/30 rounded-full px-6 py-2.5 bg-white/5 backdrop-blur-md"
        >
          <span className="font-serif text-lg tracking-[0.3em] text-wedding-gold font-light">L & V</span>
        </motion.div>

        {/* Guest Greeting */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-serif text-wedding-gold text-lg italic md:text-xl mb-3"
        >
          Olá, {firstName}
        </motion.p>

        {/* Welcome Text */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9 }}
          className="text-white font-serif text-3xl md:text-5xl font-normal tracking-wide leading-tight mb-6"
        >
          Estamos muito felizes por partilhar este momento consigo.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-stone-300 text-sm md:text-base max-w-md leading-relaxed font-sans mb-10 font-light"
        >
          A sua presença fará parte das memórias que levaremos para toda a vida. A contagem regressiva para a nossa união já começou:
        </motion.p>

        {/* Live Countdown Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-md mb-12"
        >
          {[
            { label: 'Dias', value: timeLeft.days },
            { label: 'Horas', value: timeLeft.hours },
            { label: 'Minutos', value: timeLeft.minutes },
            { label: 'Segundos', value: timeLeft.seconds },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-sm shadow-inner flex flex-col items-center justify-center"
            >
              <span className="font-serif text-2xl md:text-3xl text-wedding-gold font-semibold leading-none mb-1">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-medium font-sans">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Elegant Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnter}
          className="bg-wedding-gold hover:bg-[#d6b78d] text-stone-950 font-semibold uppercase tracking-widest text-xs px-8 py-4.5 rounded-full flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-wedding-gold/20 cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 fill-current shrink-0" />
          Ver Convite & Confirmar
          <ArrowRight className="w-3.5 h-3.5 ml-1 shrink-0" />
        </motion.button>
      </motion.div>

      {/* Decorative Bottom Corner Accents */}
      <div className="absolute bottom-0 left-0 w-32 h-32 border-t border-r border-white/5 rounded-tr-full z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-t border-l border-white/5 rounded-tl-full z-10 pointer-events-none" />
    </div>
  );
}
