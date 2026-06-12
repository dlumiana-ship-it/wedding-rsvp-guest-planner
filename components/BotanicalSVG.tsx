'use client';
import React from 'react';

interface BotanicalProps {
  color?: string;
  className?: string;
}

export const BotanicalTop = ({ color = "#7B8B6F", className = "" }: BotanicalProps) => (
  <svg viewBox="0 0 500 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ width: '100%', height: 'auto', display: 'block' }}>
    {/* Soft Watercolor-like background blotches (Optional, but gives that premium feel) */}
    <ellipse cx="150" cy="30" rx="80" ry="40" fill={color} opacity="0.04" filter="blur(8px)" />
    <ellipse cx="350" cy="40" rx="90" ry="50" fill={color} opacity="0.03" filter="blur(10px)" />
    <ellipse cx="250" cy="10" rx="120" ry="30" fill={color} opacity="0.05" filter="blur(12px)" />

    {/* Elegant Vine Branches (Line Art) */}
    <path d="M 0 0 Q 150 80 250 110 T 500 20" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
    <path d="M 50 0 Q 180 120 280 130 T 500 60" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />
    <path d="M -20 40 Q 100 130 200 140 T 400 150" stroke={color} strokeWidth="0.6" fill="none" opacity="0.4" />

    {/* Elegant Leaves Left Side */}
    <path d="M 80 38 C 70 50 60 40 70 30 C 80 20 90 30 80 38 Z" fill={color} opacity="0.5" />
    <path d="M 120 62 C 105 75 95 65 110 50 C 125 35 135 50 120 62 Z" fill={color} opacity="0.6" />
    <path d="M 160 85 C 145 100 135 85 150 70 C 165 55 175 75 160 85 Z" fill={color} opacity="0.4" />
    <path d="M 200 102 C 185 115 175 105 190 90 C 205 75 215 95 200 102 Z" fill={color} opacity="0.7" />
    <path d="M 230 108 C 215 125 205 115 220 95 C 235 75 245 95 230 108 Z" fill={color} opacity="0.5" />
    
    <path d="M 100 95 C 80 110 70 95 90 80 C 110 65 120 85 100 95 Z" fill={color} opacity="0.3" />
    <path d="M 140 115 C 120 130 110 115 130 100 C 150 85 160 105 140 115 Z" fill={color} opacity="0.4" />
    <path d="M 180 132 C 165 145 155 135 170 120 C 185 105 195 125 180 132 Z" fill={color} opacity="0.2" />

    {/* Elegant Leaves Right Side */}
    <path d="M 420 32 C 430 45 440 35 430 25 C 420 15 410 25 420 32 Z" fill={color} opacity="0.5" />
    <path d="M 380 50 C 395 65 405 55 390 40 C 375 25 365 40 380 50 Z" fill={color} opacity="0.6" />
    <path d="M 330 75 C 345 90 355 80 340 65 C 325 50 315 65 330 75 Z" fill={color} opacity="0.4" />
    <path d="M 290 95 C 305 110 315 100 300 85 C 285 70 275 85 290 95 Z" fill={color} opacity="0.7" />
    
    <path d="M 390 85 C 410 100 420 85 400 70 C 380 55 370 75 390 85 Z" fill={color} opacity="0.3" />
    <path d="M 350 105 C 370 120 380 105 360 90 C 340 75 330 95 350 105 Z" fill={color} opacity="0.4" />
    <path d="M 310 120 C 325 135 335 125 320 110 C 305 95 295 115 310 120 Z" fill={color} opacity="0.5" />
    
    {/* Delicate Berries/Dots */}
    <circle cx="150" cy="100" r="2.5" fill={color} opacity="0.8" />
    <circle cx="140" cy="110" r="1.5" fill={color} opacity="0.6" />
    <circle cx="160" cy="105" r="2" fill={color} opacity="0.5" />
    
    <circle cx="340" cy="95" r="2.5" fill={color} opacity="0.8" />
    <circle cx="350" cy="85" r="1.5" fill={color} opacity="0.6" />
    <circle cx="330" cy="90" r="2" fill={color} opacity="0.5" />
    
    <circle cx="250" cy="130" r="2" fill={color} opacity="0.6" />
    <circle cx="260" cy="120" r="1.5" fill={color} opacity="0.4" />
  </svg>
);

export const BotanicalBottom = ({ color = "#7B8B6F", className = "" }: BotanicalProps) => (
  <div className={className} style={{ transform: 'rotate(180deg)' }}>
    <BotanicalTop color={color} />
  </div>
);
