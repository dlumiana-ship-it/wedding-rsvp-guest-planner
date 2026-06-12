'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, MessageCircle, Copy, Check, MapPin, Gift, Church, FileText, Link as LinkIcon } from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  side: 'Bride' | 'Groom';
  phone?: string;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
}

export default function InviteModal({ isOpen, onClose, guest }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!guest) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lumianaevicente.com';
  const rsvpUrl = appUrl;
  const firstName = guest.name.split(' ')[0];

  const primaryColor = '#7B8B6F'; // Sage Green
  const goldColor = '#B89759'; // Elegant Gold
  const darkText = '#333333'; // Soft black for high contrast
  const paperColor = '#FAF8F5'; // Off-white warm paper

  // ── Print only the card ───────────────────────────────────────────────────
  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'invite-print-style';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
      @media print {
        @page { size: A5 portrait; margin: 0; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > *:not(#invite-print-root) { display: none !important; }
        #invite-print-root { display: flex !important; align-items: center; justify-content: center; min-height: 100vh; background: ${paperColor} !important; }
      }
    `;
    document.head.appendChild(style);

    const existing = document.getElementById('invite-print-root');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'invite-print-root';
    root.style.cssText = 'display:none;';

    if (cardRef.current) {
      root.appendChild(cardRef.current.cloneNode(true));
    }
    document.body.appendChild(root);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        root.remove();
        style.remove();
      }, 1500);
    }, 150);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(rsvpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = `Olá ${firstName}! 🌿\n\n` +
      `Temos a alegria de partilhar consigo o convite para o nosso casamento.\n\n` +
      `📅 29 de Agosto de 2026\n📍 Maputo\n\n` +
      `Clique no link abaixo para aceder ao convite interativo e confirmar a sua presença:\n` +
      `👉 ${rsvpUrl}\n\n` +
      `Com carinho,\nLumiana & Vicente`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[92vh] z-50 flex flex-col"
          >
            {/* Custom fonts for this modal */}
            <style dangerouslySetInnerHTML={{ __html: `
              @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
            `}} />

            {/* Header */}
            <div className="bg-white rounded-t-2xl px-6 py-4 flex items-center justify-between border-b border-stone-100">
              <div>
                <p className="text-stone-800 font-serif font-semibold text-lg leading-tight">Convite Digital</p>
                <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] mt-0.5">{guest.name}</p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card preview — scrollable */}
            <div className="flex-1 overflow-y-auto bg-stone-100/80 flex items-center justify-center py-10 px-4">

              {/* THE ACTUAL INVITE CARD (Premium Layout) */}
              <div
                ref={cardRef}
                className="w-full max-w-[380px] select-none relative overflow-hidden"
                style={{
                  backgroundColor: paperColor,
                  borderRadius: '2px',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(123,139,111,0.1)',
                  minHeight: '640px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Padding superior limpo para manter o design focado e minimalista */}
                <div style={{ padding: '48px 32px 0', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  
                  {/* Monogram */}
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '20px',
                    color: primaryColor,
                    letterSpacing: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span>L</span>
                    <span style={{ fontSize: '14px', opacity: 0.3, fontWeight: 300 }}>|</span>
                    <span>V</span>
                  </div>

                  {/* Quote */}
                  <p style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '6px',
                    fontWeight: 500,
                    color: '#888',
                    letterSpacing: '1.5px',
                    textAlign: 'center',
                    lineHeight: '1.8',
                    marginBottom: '24px',
                    maxWidth: '80%'
                  }}>
                    "O AMOR SÓ É LINDO QUANDO ENCONTRAMOS ALGUÉM<br />
                    QUE NOS TRANSFORME NO MELHOR QUE PODEMOS SER."<br />
                    <span style={{ fontSize: '5px', opacity: 0.6, display: 'block', marginTop: '4px' }}>(MÁRIO QUINTANA)</span>
                  </p>

                  {/* Guest Personalization */}
                  <div style={{ textAlign: 'center', marginBottom: '20px', width: '100%' }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '6px', fontWeight: 600, color: '#A0A0A0', letterSpacing: '3px', marginBottom: '6px' }}>
                      ESPECIALMENTE PARA
                    </p>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, color: darkText, letterSpacing: '0.5px' }}>
                      {guest.name}
                    </p>
                  </div>

                  <div style={{ width: '20px', height: '1px', background: `${primaryColor}40`, marginBottom: '20px' }} />

                  {/* Couple Names (Fixed Typography) */}
                  <h1 style={{
                    fontFamily: "'Great Vibes', cursive",
                    fontSize: '44px',
                    color: goldColor,
                    margin: '0 0 16px 0',
                    lineHeight: '1',
                    textAlign: 'center',
                    fontWeight: 400,
                    textShadow: 'none',
                    WebkitFontSmoothing: 'antialiased'
                  }}>
                    Lumiana e Vicente
                  </h1>

                  <div style={{ color: primaryColor, fontSize: '10px', marginBottom: '16px' }}>♥</div>

                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '6px', fontWeight: 600, color: '#A0A0A0', letterSpacing: '3px', marginBottom: '28px' }}>
                    CONVIDAM PARA SEU CASAMENTO
                  </p>

                  {/* Structured Date Block */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '36px', width: '100%' }}>
                    <div style={{ flex: 1, borderTop: `1px solid ${primaryColor}30`, borderBottom: `1px solid ${primaryColor}30`, padding: '6px 0', textAlign: 'center' }}>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 500, color: primaryColor, letterSpacing: '3px', margin: 0 }}>SÁBADO</p>
                    </div>
                    
                    <div style={{ textAlign: 'center', padding: '0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 600, color: '#888', letterSpacing: '3px', margin: '0 0 2px 0' }}>AGOSTO</p>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', color: darkText, margin: '-6px 0 -10px 0', lineHeight: '1' }}>29</p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 600, color: '#888', letterSpacing: '3px', margin: '6px 0 0 0' }}>2026</p>
                    </div>

                    <div style={{ flex: 1, borderTop: `1px solid ${primaryColor}30`, borderBottom: `1px solid ${primaryColor}30`, padding: '6px 0', textAlign: 'center' }}>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 500, color: primaryColor, letterSpacing: '3px', margin: 0 }}>ÀS 12:00</p>
                    </div>
                  </div>

                  {/* Interactive Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '32px' }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '5px', fontWeight: 600, color: goldColor, letterSpacing: '2px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '7px' }}>✦</span> CLIQUE NO BOTÃO ABAIXO <span style={{ fontSize: '7px' }}>✦</span>
                    </p>
                    
                    <a href={rsvpUrl} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '12px 32px',
                      border: `1px solid ${primaryColor}60`,
                      borderRadius: '30px',
                      color: primaryColor,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      backgroundColor: 'transparent'
                    }}>
                      <LinkIcon size={12} strokeWidth={2} />
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '6px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' }}>
                        Confirmar Presença & Informações
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-b-2xl border-t border-stone-100 p-5 space-y-3">
              <button
                onClick={handleWhatsApp}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-[0_4px_16px_rgba(37,211,102,0.2)] active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar por WhatsApp
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePrint}
                  className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4 text-stone-500" />
                  Guardar como PDF
                </button>
                <button
                  onClick={handleCopyLink}
                  className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 active:scale-[0.98]"
                >
                  {copied ? <><Check className="w-4 h-4 text-emerald-600" /> Copiado</> : <><Copy className="w-4 h-4 text-stone-500" /> Copiar Link</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
