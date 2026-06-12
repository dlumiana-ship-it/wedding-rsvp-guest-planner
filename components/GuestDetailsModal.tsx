'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Phone, User, Utensils, Music, MapPin,
  Bed, CheckCircle2, Send, Clock, QrCode, FileText
} from 'lucide-react';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: any;
  onOpenInvite: (guest: any) => void;
}

export default function GuestDetailsModal({ isOpen, onClose, guest, onOpenInvite }: GuestDetailsModalProps) {
  if (!guest) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[90vh] bg-stone-50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                  guest.side === 'Bride' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {guest.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900">{guest.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      guest.side === 'Bride' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {guest.side === 'Bride' ? '♥ Lado da Noiva' : '♦ Lado do Noivo'}
                    </span>
                    {guest.checkIn && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Check-in feito
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Contacto & Convite (Destaque Principal) */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Informações de Contacto
                  </h3>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center border border-stone-100">
                      <Phone className="w-4 h-4 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-semibold uppercase">Telemóvel</p>
                      <p className="text-sm font-semibold text-stone-900 font-mono mt-0.5">{guest.phone || 'Sem contacto'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenInvite(guest);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Enviar Convite / PDF
                  </button>
                </div>
              </div>

              {/* Grid de Informações Secundárias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Mesa */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-stone-50 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-wedding-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Alocação de Mesa</p>
                    <p className="text-sm font-semibold text-stone-900 mt-0.5">
                      {guest.tableId ? `Mesa ${guest.tableId}` : 'Sem mesa atribuída'}
                    </p>
                  </div>
                </div>

                {/* Dieta */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-stone-50 rounded-lg shrink-0">
                    <Utensils className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Restrições Alimentares</p>
                    <p className="text-sm font-semibold text-stone-900 mt-0.5">{guest.diet}</p>
                    {guest.dietDetails && (
                      <p className="text-[11px] text-stone-500 italic mt-1">{guest.dietDetails}</p>
                    )}
                  </div>
                </div>

                {/* Alojamento */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-stone-50 rounded-lg shrink-0">
                    <Bed className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Alojamento</p>
                    <p className="text-sm font-semibold text-stone-900 mt-0.5">
                      {guest.needsAccommodation === 'Yes' ? 'Necessita alojamento' : 'Não necessita'}
                    </p>
                    {guest.accommodationDetails && (
                      <p className="text-[11px] text-stone-500 italic mt-1">{guest.accommodationDetails}</p>
                    )}
                  </div>
                </div>

                {/* Música */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-stone-50 rounded-lg shrink-0">
                    <Music className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Pedido de Música</p>
                    {guest.musicRequest ? (
                      <p className="text-sm font-semibold text-stone-900 mt-0.5">"{guest.musicRequest}"</p>
                    ) : (
                      <p className="text-sm text-stone-400 mt-0.5">—</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Informação do Sistema */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">Dados de Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="text-stone-400">ID Único:</span>
                    <p className="font-mono text-stone-700 mt-0.5">{guest.id}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">Data de Registo:</span>
                    <p className="text-stone-700 mt-0.5">
                      {new Date(guest.timestamp).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
