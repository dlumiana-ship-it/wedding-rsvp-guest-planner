'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Printer, Heart, BookOpen, Loader2 } from 'lucide-react';

interface WallMessage {
  id: string;
  guestName: string;
  content: string;
  createdAt: string;
}

interface GalleryPhoto {
  id: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

interface Guest {
  id: string;
  name: string;
  side: string;
  checkIn: boolean;
}

export default function MemoryBookExporter() {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      // 1. Fetch all required data from APIs to get the most updated list
      const [guestsRes, messagesRes, photosRes] = await Promise.all([
        fetch('/api/guests'),
        fetch('/api/wall'),
        fetch('/api/gallery')
      ]);

      const guestsData = await guestsRes.json();
      const messagesData = await messagesRes.json();
      const photosData = await photosRes.json();

      const checkedInGuests = (guestsData.guests || []).filter((g: Guest) => g.checkIn);
      const approvedMessages = (messagesData.messages || []).filter((m: any) => m.approved);
      const approvedPhotos = (photosData.photos || []).filter((p: any) => p.approved);

      // 2. Create Print Style Element
      const style = document.createElement('style');
      style.id = 'memory-book-print-style';
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #001B3D !important;
            font-family: 'Inter', sans-serif !important;
          }
          body > *:not(#memory-book-print-root) {
            display: none !important;
          }
          #memory-book-print-root {
            display: block !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .page-container {
            min-height: 250mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }
      `;
      document.head.appendChild(style);

      // 3. Create Print Container
      const existing = document.getElementById('memory-book-print-root');
      if (existing) existing.remove();

      const root = document.createElement('div');
      root.id = 'memory-book-print-root';
      root.style.cssText = 'display: none; padding: 20px;';

      // 4. Build HTML layout for print
      root.innerHTML = `
        <!-- PAGE 1: COVER -->
        <div class="page-container">
          <div style="text-align: center; margin-top: 60mm;">
            <div style="font-family: 'Playfair Display', serif; font-size: 24px; letter-spacing: 6px; color: #C5A880; margin-bottom: 25px;">L & V</div>
            <h1 style="font-family: 'Playfair Display', serif; font-size: 46px; font-weight: normal; color: #001B3D; margin: 0 0 10px 0; line-height: 1.2;">
              Livro de Memórias
            </h1>
            <p style="font-family: 'Playfair Display', serif; font-size: 18px; font-style: italic; color: #800020; margin: 0 0 40px 0;">
              O Começo da Nossa Eternidade
            </p>
            <div style="width: 40px; height: 1px; background: #C5A880; margin: 0 auto 40px auto;"></div>
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #666;">
              Lumiana & Vicente
            </p>
            <p style="font-size: 10px; color: #999; margin-top: 5px;">
              12 DE SETEMBRO DE 2026 • MAPUTO
            </p>
          </div>
          <div style="text-align: center; font-size: 9px; color: #999; margin-bottom: 10mm;">
            Este livro compila os votos, fotos e lembranças de todos que partilharam deste dia abençoado.
          </div>
        </div>

        <!-- PAGE 2: CHRONOLOGY & PRESENCE -->
        <div class="page-container page-break">
          <div style="margin-top: 15mm;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #001B3D; border-bottom: 1px solid #E5E5E5; padding-bottom: 8px; margin-bottom: 20px;">
              A Celebração
            </h2>
            <p style="font-size: 12px; color: #666; margin-bottom: 25px;">
              No dia 12 de Setembro de 2026, na Capela da Polana em Maputo, unimos as nossas vidas diante de Deus, rodeados de familiares e amigos queridos.
            </p>

            <h3 style="font-family: 'Playfair Display', serif; font-size: 16px; color: #800020; margin-bottom: 12px;">Lista de Presenças</h3>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 8px 24px; font-size: 11px; color: #333;">
              ${checkedInGuests.length === 0 
                ? '<p style="grid-column: 1/-1; color: #999; font-style: italic;">Nenhum registo de entrada realizado.</p>'
                : checkedInGuests.map((g: Guest) => `<div>• ${g.name} <span style="font-size: 9px; color: #888;">(${g.side === 'Bride' ? 'Noiva' : 'Noivo'})</span></div>`).join('')
              }
            </div>
          </div>
        </div>

        <!-- PAGE 3: MESSAGES WALL -->
        <div class="page-container page-break">
          <div style="margin-top: 15mm;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #001B3D; border-bottom: 1px solid #E5E5E5; padding-bottom: 8px; margin-bottom: 20px;">
              Votos & Mensagens dos Convidados
            </h2>
            <div style="display: flex; flex-direction: column; gap: 20px;">
              ${approvedMessages.length === 0 
                ? '<p style="color: #999; font-style: italic; font-size: 12px;">Nenhuma mensagem registada no mural.</p>'
                : approvedMessages.map((m: WallMessage) => `
                  <div style="background: #FDFCFB; border: 1px solid #F0ECE6; border-radius: 8px; padding: 12px 16px;">
                    <p style="font-size: 11px; color: #444; font-style: italic; line-height: 1.5; margin: 0 0 8px 0;">
                      &ldquo;${m.content}&rdquo;
                    </p>
                    <p style="font-size: 10px; font-weight: bold; color: #001B3D; margin: 0; text-align: right;">
                      — ${m.guestName}
                    </p>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <!-- PAGE 4: PHOTO ALBUM -->
        ${approvedPhotos.length > 0 ? `
          <div class="page-container page-break">
            <div style="margin-top: 15mm;">
              <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #001B3D; border-bottom: 1px solid #E5E5E5; padding-bottom: 8px; margin-bottom: 25px;">
                Álbum de Fotos Colaborativo
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                ${approvedPhotos.map((p: GalleryPhoto) => `
                  <div style="border: 1px solid #E5E5E5; border-radius: 12px; padding: 8px; background: #FFF; text-align: center; break-inside: avoid;">
                    <img src="${p.url}" style="width: 100%; height: 120mm; object-cover: fit; border-radius: 8px; margin-bottom: 8px;" />
                    <span style="font-size: 9px; color: #666; font-weight: 550;">Enviada por ${p.uploadedBy}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      `;

      document.body.appendChild(root);

      // 5. Trigger window.print
      setTimeout(() => {
        window.print();
        
        // 6. Clean up elements after printing
        setTimeout(() => {
          root.remove();
          style.remove();
          setLoading(false);
        }, 1500);
      }, 300);

    } catch (e) {
      console.error(e);
      alert('Erro ao exportar o livro de memórias.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#001B3D] to-[#00122E] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
      {/* Decorative vectors */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-wedding-gold/5 rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg text-left">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-wedding-gold" />
            <span className="text-[10px] uppercase tracking-widest text-wedding-gold font-bold">Recordação Eterna</span>
          </div>
          <h3 className="font-serif text-xl md:text-2xl font-normal leading-tight text-white">
            Livro Digital de Memórias (PDF)
          </h3>
          <p className="text-stone-300 text-xs leading-relaxed font-light">
            Gere um livro digital em formato PDF contendo todos os votos de felicidades do mural, fotos aprovadas da galeria colaborativa e a lista de convidados que marcaram presença.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={loading}
          className="bg-wedding-gold hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-75"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> A Gerar Livro...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" /> Exportar Livro (PDF)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
