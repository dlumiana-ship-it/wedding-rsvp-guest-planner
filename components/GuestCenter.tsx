'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Heart, Calendar, MapPin, Music, Utensils, Info, Check, 
  ChevronDown, ChevronUp, Edit3, MessageSquare, Compass, Send, Plus, Trash2, Sparkles, PartyPopper,
  CheckCircle2, User, X, Smartphone, Bell
} from 'lucide-react';
import MusicRequestWidget from './MusicRequestWidget';

interface Companion {
  id?: string;
  name: string;
  diet: string;
  dietDetails?: string | null;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  side: 'Bride' | 'Groom';
  status: string;
  vip?: boolean;
  diet: string;
  dietDetails?: string | null;
  musicRequest?: string | null;
  needsAccommodation: string;
  accommodationDetails?: string | null;
  rsvpMessage?: string | null;
  giftDeliveryMethod?: string | null;
  tableId?: number | null;
  checkIn: boolean;
  companions?: Companion[];
}

interface GuestCenterProps {
  guest: Guest;
  tableName: string;
  onUpdateGuest: (updated: Guest) => void;
  onLogout: () => void;
  tableCompanions?: string[];
  giftSuggestions?: any[];
}

const DIET_OPTIONS = [
  'Nenhuma',
  'Vegetariano',
  'Vegano',
  'Sem Glúten',
  'Sem Lactose',
  'Diabético',
  'Alergias (Especificar)',
];

export default function GuestCenter({ guest, tableName, onUpdateGuest, onLogout, tableCompanions, giftSuggestions = [] }: GuestCenterProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  
  // PWA & Notification states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Local countdown update for the widget preview
    const targetDate = new Date('2026-09-12T12:00:00');
    const updateTime = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // PWA checks
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
      const handlePrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handlePrompt);

      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeinstallprompt', handlePrompt);
      };
    }
    return () => clearInterval(interval);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('O seu navegador não suporta notificações de ambiente de trabalho.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      const targetDate = new Date('2026-09-12T12:00:00');
      const diff = targetDate.getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      new Notification("Notificações Ativadas! 🌿", {
        body: `Faltam ${days > 0 ? days : 0} dias para o casamento de Lumiana & Vicente. Irá receber novidades diretamente no seu dispositivo!`,
        icon: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=128',
      });
    }
  };
  
  const parseGiftData = (methodString: string | null | undefined) => {
    if (!methodString) return { method: 'Ainda não decidi', name: '', notes: '' };
    const parts = methodString.split('|').map(s => s.trim());
    return {
      method: parts[0] || 'Ainda não decidi',
      name: parts[1] || '',
      notes: parts[2] || ''
    };
  };

  const initialGiftData = parseGiftData(guest.giftDeliveryMethod);
  const [deliveryMethod, setDeliveryMethod] = useState(initialGiftData.method);
  const [giftName, setGiftName] = useState(initialGiftData.name);
  const [giftNotes, setGiftNotes] = useState(initialGiftData.notes);

  const [loading, setLoading] = useState(false);
  const [confirmingPresence, setConfirmingPresence] = useState(false);
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  
  const [mcMoments, setMcMoments] = useState<any[]>([]);

  // Carregar cronograma ao vivo do MC
  useEffect(() => {
    const fetchMoments = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('wedding_mc_moments');
        if (saved) {
          setMcMoments(JSON.parse(saved));
        } else {
          setMcMoments([
            { id: '1', title: 'Cerimónia Religiosa', status: 'pending' },
            { id: '2', title: 'Cocktail de Boas-Vindas', status: 'pending' },
            { id: '3', title: 'Sessão Fotográfica', status: 'pending' },
            { id: '4', title: 'Entrada dos Noivos', status: 'pending' },
            { id: '5', title: 'Almoço & Discursos', status: 'pending' },
            { id: '6', title: 'Abertura da Pista de Dança', status: 'pending' }
          ]);
        }
      }
    };
    
    fetchMoments();
    const interval = setInterval(fetchMoments, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check if RSVP edits are still allowed (Deadline: August 15, 2026)
  const deadlineDate = new Date('2026-08-15T23:59:59');
  const canEdit = new Date() < deadlineDate;

  const savedSongs = guest.musicRequest 
    ? guest.musicRequest.split('|').map(s => s.trim()).filter(Boolean)
    : [];



  const handleSaveChanges = async () => {
    setLoading(true);
    const combinedGiftString = `${deliveryMethod} | ${giftName} | ${giftNotes}`;
    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: guest.id,
          giftDeliveryMethod: combinedGiftString
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onUpdateGuest(data.guest);
        setShowEditModal(false);
      } else {
        alert(data.error || 'Erro ao guardar as alterações.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de rede ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPresence = async () => {
    if (confirmingPresence || guest.status === 'CONFIRMED') return;
    setConfirmingPresence(true);
    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: guest.id,
          status: 'CONFIRMED',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Enviar notificação ao Staff via localStorage
        const notifications = JSON.parse(localStorage.getItem('wedding_staff_notifications') || '[]');
        notifications.unshift({
          id: `notif-${Date.now()}`,
          type: 'CONFIRMATION',
          message: `${guest.name} confirmou presença no evento!`,
          guestName: guest.name,
          guestId: guest.id,
          timestamp: new Date().toISOString(),
          read: false,
        });
        localStorage.setItem('wedding_staff_notifications', JSON.stringify(notifications));

        // Mostrar tela de sucesso
        setShowConfirmSuccess(true);

        // Atualizar o estado após 4 segundos
        setTimeout(() => {
          setShowConfirmSuccess(false);
          onUpdateGuest(data.guest);
        }, 4000);
      } else {
        alert(data.error || 'Erro ao confirmar presença.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de rede.');
    } finally {
      setConfirmingPresence(false);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSubmittingMessage(true);
    try {
      const res = await fetch('/api/wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guest.name,
          guestId: guest.id,
          content: messageText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessageText('');
        setMessageSuccess(true);
        setTimeout(() => setMessageSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingMessage(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* 1. GUEST PORTAL SUMMARY & QR CODE (col-span-4) */}
      <div className="lg:col-span-4 bg-white border border-[#001B3D]/10 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] uppercase tracking-widest text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded-full">
              {guest.vip ? '✦ Convidado VIP' : 'Confirmado'}
            </span>
          </div>

          <h3 className="font-serif text-xl text-[#001B3D] mb-1">
            Olá, {guest.companions?.[0]?.name 
              ? `${guest.name.split(' ')[0]} & ${guest.companions[0].name.split(' ')[0]}` 
              : guest.name}!
          </h3>
          <p className="text-xs text-stone-500 mb-6">Este é o seu portal exclusivo do casamento.</p>

          <div className="flex flex-col items-center p-6 bg-stone-50 border border-stone-100 rounded-2xl mb-4">
            <QRCodeSVG value={guest.id} size={150} level="H" includeMargin={true} />
            <span className="text-xs font-semibold text-[#001B3D] mt-3">Código de Check-in</span>
            <span className="text-[10px] text-stone-400">Apresente à entrada para aceder</span>
          </div>

          {guest.checkIn ? (
            <div className="bg-[#F3FAF6] border-2 border-[#10B981] rounded-2xl p-5 text-left space-y-4 shadow-sm">
              {/* Status Header */}
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#065F46] tracking-wide">
                    Check-in Confirmado ✓
                  </h4>
                  <p className="text-[9px] text-stone-500 font-medium mt-0.5">
                    {new Date().toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>

              {/* Guest Details */}
              <div className="flex items-center gap-2 border-t border-emerald-100/60 pt-3">
                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="font-bold text-stone-850 text-xs truncate max-w-[120px]">{guest.name}</span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  guest.side === 'Bride'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {guest.side === 'Bride' ? '♥ Noiva' : '♦ Noivo'}
                </span>
              </div>

              {/* Table details */}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-xs text-stone-700">Mesa <strong className="text-stone-900 font-bold">{tableName || guest.tableId || 'Não definida'}</strong></span>
              </div>

              {/* Yellow Alert Box */}
              <div className="bg-[#FEF9E7] border border-[#FDE68A] rounded-xl p-3 text-[10px] font-semibold text-amber-800 leading-relaxed">
                {guest.name}, o seu check-in foi realizado com sucesso. Seja bem-vindo(a)! Mesa: {guest.tableId || 'Não definida'}
              </div>

              {/* Table indications */}
              <div className="border-t border-emerald-100/60 pt-3">
                <span className="text-[9px] uppercase font-bold text-stone-400 block mb-1">Indicações da Mesa</span>
                <p className="leading-relaxed text-[10px] text-stone-600">
                  {guest.tableId ? (
                    guest.vip ? "Ala de Honra: Próxima à mesa presidencial de Lumiana e Vicente." :
                    guest.tableId % 2 === 0 ? "Ala Esquerda: Siga pelo corredor esquerdo em direção ao jardim suspenso." :
                    "Ala Direita: Siga pelo corredor direito próximo ao piano de cauda."
                  ) : "Aguarde definição de mesa pela recepção."}
                </p>
              </div>

              {tableCompanions && tableCompanions.length > 0 && (
                <div className="border-t border-emerald-100/60 pt-3">
                  <span className="text-[9px] uppercase font-bold text-stone-400 block mb-1.5">Na sua mesa estarão:</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {tableCompanions.map((name: string, i: number) => {
                      const displayName = name.includes('(') 
                        ? `${name.split(' ')[0]} ${name.substring(name.indexOf('('))}` 
                        : name.split(' ')[0];
                      return (
                        <span key={i} className="text-[9px] bg-white border border-stone-200/60 px-2 py-0.5 rounded-full text-stone-700 font-medium">
                          👤 {displayName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-stone-50 rounded-2xl p-4 text-center border border-stone-100">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Sua Mesa</span>
              <span className="font-serif text-lg font-semibold text-wedding-navy">
                {tableName || 'A ser definida pela recepção'}
              </span>
            </div>
          )}
        </div>

        {guest.status !== 'CONFIRMED' && !showConfirmSuccess && (
          <button
            onClick={handleConfirmPresence}
            disabled={confirmingPresence}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/60 active:scale-[0.98]"
          >
            {confirmingPresence ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                A confirmar...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar a Minha Presença
              </>
            )}
          </button>
        )}

        {guest.status === 'CONFIRMED' && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold">Presença confirmada com sucesso!</span>
          </div>
        )}

        {giftName && (
          <div className="mt-3 bg-stone-50 border border-stone-200/60 rounded-xl p-3.5 text-left space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-stone-400 block mb-0.5">Presente Selecionado</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <div>
                <span className="text-xs font-bold text-wedding-navy block truncate max-w-[220px]">
                  {giftName}
                </span>
                {giftNotes && (
                  <span className="text-[9px] text-stone-500 block truncate max-w-[220px] italic">
                    {giftNotes}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[9px] text-stone-400 block pt-1 border-t border-stone-200/50">
              Método: {deliveryMethod}
            </span>
          </div>
        )}

        {canEdit ? (
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full mt-3 py-3 border border-[#001B3D]/20 hover:border-[#800020] hover:text-[#800020] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
          >
            <Edit3 className="w-3.5 h-3.5" /> Atualizar Informação do Presente
          </button>
        ) : (
          <div className="mt-6 text-center text-[10px] text-stone-400 italic">
            Alterações trancadas após {deadlineDate.toLocaleDateString('pt-PT')}
          </div>
        )}
      </div>

      {/* 2. REGISTRATION DETAILS, ACCOMPANISTS & MUSIC (col-span-8) */}
      <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Real-time Timeline */}
          <div className="bg-white border border-[#001B3D]/10 rounded-3xl p-6 flex flex-col justify-between h-full">
            <div>
              <h4 className="font-serif text-base text-wedding-navy border-b border-stone-100 pb-2 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-wedding-burgundy" /> Cronograma ao Vivo
              </h4>
              <p className="text-[10px] text-stone-500 mb-4 leading-relaxed">
                Acompanhe em tempo real as atividades do casamento organizadas pela equipa de protocolo.
              </p>
              <div className="space-y-4">
                {mcMoments.map((moment, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center mt-0.5 z-10">
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border-[3px] transition-all duration-500 ${moment.status === 'completed' ? 'bg-[#001B3D] border-[#001B3D]' : moment.status === 'in_progress' ? 'bg-[#C5A880] border-[#C5A880] scale-110 shadow-[0_0_8px_rgba(197,168,128,0.6)]' : 'bg-white border-stone-300'}`} />
                      {idx !== mcMoments.length - 1 && <div className={`w-[2px] h-7 mt-1 rounded-full ${moment.status === 'completed' ? 'bg-[#001B3D]' : 'bg-stone-200'}`} />}
                    </div>
                    <div className="flex-1 pb-1">
                      <span className={`text-xs font-semibold block transition-colors duration-300 ${moment.status === 'in_progress' ? 'text-[#800020] text-[13px]' : moment.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                        {moment.title}
                      </span>
                      {moment.status === 'in_progress' && <span className="text-[9px] uppercase tracking-wider text-[#C5A880] font-bold mt-0.5 block animate-pulse">A decorrer agora...</span>}
                      {moment.status === 'completed' && <span className="text-[9px] text-stone-400 mt-0.5 block">Concluído</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Music requests widget */}
          <MusicRequestWidget
            currentMusic={guest.musicRequest || undefined}
            userId={guest.id}
            userName={guest.name}
            onMusicSaved={(newMusic: string) => {
              onUpdateGuest({ ...guest, musicRequest: newMusic });
            }}
          />
        </div>

        {/* Widget & Notificações Card */}
        <div className="bg-white border border-[#001B3D]/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 border-b border-stone-100 pb-2">
            <Smartphone className="w-5 h-5 text-wedding-gold" />
            <div>
              <h4 className="font-serif text-base text-wedding-navy">Widget & Notificações Push</h4>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Atalhos e Alertas no Telemóvel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Countdown Widget Live Preview (col-span-5) */}
            <div className="md:col-span-5">
              <div className="bg-[#030d1a] border border-white/10 rounded-3xl p-4 text-white relative overflow-hidden shadow-xl aspect-square max-w-[200px] mx-auto flex flex-col justify-between">
                {/* Background mesh */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#800020] rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse"></div>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#C5A880] rounded-full mix-blend-screen filter blur-xl opacity-25 animate-pulse delay-1000"></div>
                  <div className="absolute inset-0 bg-[#001B3D]/80 backdrop-blur-xl"></div>
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-[#800020] fill-[#800020] animate-pulse" />
                    <span className="font-serif text-[10px] font-semibold text-white tracking-widest">L & V</span>
                  </div>
                  <span className="text-[7px] uppercase tracking-widest text-[#C5A880] font-bold">Widget</span>
                </div>

                {/* Ticking Countdown digits */}
                <div className="relative z-10 grid grid-cols-4 gap-1 text-center my-auto">
                  <div className="bg-white/5 border border-white/5 rounded-lg py-1 px-0.5">
                    <span className="text-sm font-serif text-[#C5A880] font-bold block leading-none">{timeLeft.days}</span>
                    <span className="text-[5px] uppercase tracking-wider text-stone-400 block mt-0.5">Dias</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg py-1 px-0.5">
                    <span className="text-sm font-serif text-[#C5A880] font-bold block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[5px] uppercase tracking-wider text-stone-400 block mt-0.5">Horas</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg py-1 px-0.5">
                    <span className="text-sm font-serif text-[#C5A880] font-bold block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[5px] uppercase tracking-wider text-stone-400 block mt-0.5">Min.</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg py-1 px-0.5">
                    <span className="text-sm font-serif text-[#C5A880] font-bold block leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[5px] uppercase tracking-wider text-stone-400 block mt-0.5">Seg.</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 border-t border-white/5 pt-1.5 text-center">
                  <span className="text-[6px] uppercase tracking-widest text-stone-400 block">12 de Setembro de 2026</span>
                  <span className="text-[7px] italic font-serif text-white/95 block mt-0.5">Lumiana & Vicente</span>
                </div>
              </div>
            </div>

            {/* Controls (col-span-7) */}
            <div className="md:col-span-7 space-y-4">
              <p className="text-stone-600 text-xs leading-relaxed font-light">
                Fixe o atalho do widget de contagem decrescente no ecrã principal do seu telemóvel para aceder instantaneamente e ative as notificações push para receber avisos sobre o grande dia.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {/* Installation Button */}
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallPWA}
                    type="button"
                    className="flex-1 py-2.5 px-4 bg-wedding-navy hover:bg-[#800020] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-wedding-gold" />
                    Fixar no Ecrã Principal
                  </button>
                ) : (
                  <button
                    onClick={() => setShowIosInstructions(true)}
                    type="button"
                    className="flex-1 py-2.5 px-4 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-stone-200 active:scale-95 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-stone-500" />
                    Como Fixar no Ecrã
                  </button>
                )}

                {/* Notifications Button */}
                <button
                  onClick={handleEnableNotifications}
                  disabled={notificationPermission === 'granted'}
                  type="button"
                  className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 cursor-default'
                      : 'bg-wedding-gold hover:bg-[#d6b78d] text-stone-950 shadow-md active:scale-95'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {notificationPermission === 'granted' ? 'Notificações Ativas ✓' : 'Ativar Alertas Push'}
                </button>
              </div>

              <a
                href="/widget"
                target="_blank"
                className="text-[10px] text-stone-400 hover:text-[#800020] font-bold uppercase tracking-wider block text-center hover:underline"
              >
                Abrir Widget Compacto em Ecrã Inteiro ↗
              </a>
            </div>
          </div>
        </div>

        {/* Digital Wall interactive panel */}
        <div className="bg-white border border-[#001B3D]/10 rounded-3xl p-6">
          <h4 className="font-serif text-base text-wedding-navy border-b border-stone-100 pb-2 mb-4">
            Deixar Votos no Mural Digital 💬
          </h4>
          
          <form onSubmit={handlePostMessage} className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escreva os seus votos para Lumiana & Vicente..."
              maxLength={200}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-800"
            />
            <button
              type="submit"
              disabled={submittingMessage || !messageText.trim()}
              className="px-5 bg-wedding-navy hover:bg-[#800020] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingMessage ? 'Enviando...' : (
                <>
                  <Send className="w-3 h-3" /> Publicar
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {messageSuccess && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-emerald-700 bg-emerald-50 text-[10px] font-semibold px-3 py-1 rounded-lg mt-2 text-center"
              >
                ✔ Mensagem enviada para o Mural do Evento com sucesso!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Details Overlay Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative border border-stone-100 z-10 text-stone-900 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-xl text-wedding-navy mb-6">Atualizar Informação</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {/* 1. DELIVERY METHOD */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400">Entrega de Presentes</label>
                    <select
                      value={deliveryMethod}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-xs focus:outline-none text-stone-850"
                    >
                      <option value="Ainda não decidi">Ainda não decidi</option>
                      <option value="Vou entregar na confirmação (via App)">Vou entregar agora pela plataforma / App</option>
                      <option value="Vou levar no dia do Evento (Cestão)">Vou levar fisicamente no dia do Evento (Cestão)</option>
                      <option value="Não irei oferecer presente">Não irei oferecer presente desta vez</option>
                    </select>
                  </div>

                  {/* 2. SELECT SUGGESTED GIFT */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400">Escolha o Presente do Cestão</label>
                    <select
                      value={giftSuggestions.some(g => g.name === giftName) ? giftName : (giftName ? "Outro Presente Customizado" : "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Outro Presente Customizado") {
                          setGiftName("");
                        } else {
                          setGiftName(val);
                        }
                      }}
                      className="border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-xs focus:outline-none text-stone-850"
                    >
                      <option value="">-- Selecione uma sugestão ou escreva abaixo --</option>
                      {giftSuggestions.map((suggestion: any) => (
                        <option key={suggestion.id} value={suggestion.name}>
                          {suggestion.icon} {suggestion.name}
                        </option>
                      ))}
                      <option value="Outro Presente Customizado">Outro Presente Customizado (Preencher abaixo)</option>
                    </select>
                  </div>

                  {/* 3. CUSTOM GIFT NAME OR DETAILS */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400">Nome do Presente / Detalhes (Ex: Marca, Modelo)</label>
                    <input
                      type="text"
                      value={giftName}
                      onChange={(e) => setGiftName(e.target.value)}
                      placeholder="Ex: Micro-ondas Consul 20L, ou escreva aqui..."
                      className="border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-xs focus:outline-none text-stone-850"
                    />
                  </div>

                  {/* 4. ADDITIONAL GIFT NOTES */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400">Observações Opcionais</label>
                    <input
                      type="text"
                      value={giftNotes}
                      onChange={(e) => setGiftNotes(e.target.value)}
                      placeholder="Ex: Voltagem 220V, cor preta, ou mensagem especial..."
                      className="border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-xs focus:outline-none text-stone-850"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-stone-100 pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="px-6 py-2.5 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors shadow-md cursor-pointer"
                >
                  {loading ? 'A Guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay — aparece após confirmar presença */}
      <AnimatePresence>
        {showConfirmSuccess && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-emerald-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl max-w-sm w-full p-8 md:p-10 shadow-2xl relative z-10 text-center"
            >
              {/* Confetti Dots */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [0, -80 - Math.random() * 60],
                      x: [(Math.random() - 0.5) * 120],
                      scale: [0, 1, 1, 0.5],
                    }}
                    transition={{ duration: 2, delay: i * 0.1, ease: 'easeOut' }}
                    className="absolute bottom-1/2 left-1/2 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#059669', '#D4AF37', '#800020', '#f59e0b', '#10b981', '#ec4899'][i % 6],
                    }}
                  />
                ))}
              </div>

              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, damping: 12 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200"
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-serif text-2xl text-wedding-navy mb-2"
              >
                Presença Confirmada!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-stone-500 text-sm leading-relaxed max-w-[280px] mx-auto"
              >
                Obrigado, <strong className="text-wedding-navy">{guest.name.split(' ')[0]}</strong>! A sua presença foi registada com sucesso. Os noivos foram notificados e estão muito felizes! 💍
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 flex items-center justify-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">A equipa organizadora foi notificada automaticamente</span>
              </motion.div>

              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full mt-6"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* iOS PWA Installation Instructions Modal */}
      <AnimatePresence>
        {showIosInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIosInstructions(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-stone-100 text-stone-900 text-left"
              >
                <button
                  onClick={() => setShowIosInstructions(false)}
                  type="button"
                  className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h3 className="font-serif text-lg text-wedding-navy mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-5 h-5 text-wedding-gold" />
                    Fixar no Ecrã Principal
                  </h3>
                  <p className="text-stone-500 text-xs">Adicione o atalho e o widget de contagem regressiva ao seu telemóvel.</p>
                </div>

                <div className="space-y-4 text-xs text-stone-600 leading-relaxed font-light font-sans">
                  <div className="border-l-2 border-wedding-gold pl-3">
                    <span className="font-bold text-stone-850 block mb-0.5">No Apple iPhone (iOS Safari)</span>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Clique no botão de **Partilhar** 📤 (Share) na barra inferior do Safari.</li>
                      <li>Desça o menu de opções e clique em **"Adicionar ao Ecrã Principal"** (Add to Home Screen).</li>
                      <li>Confirme o nome e clique em **"Adicionar"** no canto superior direito.</li>
                    </ol>
                  </div>

                  <div className="border-l-2 border-wedding-navy pl-3">
                    <span className="font-bold text-stone-850 block mb-0.5">No Android (Google Chrome)</span>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Clique nos **três pontos** ⠇ no canto superior direito do Chrome.</li>
                      <li>Escolha a opção **"Instalar aplicação"** ou **"Adicionar ao Ecrã Principal"**.</li>
                      <li>Confirme a instalação para ver o atalho no seu ecrã inicial.</li>
                    </ol>
                  </div>
                </div>

                <button
                  onClick={() => setShowIosInstructions(false)}
                  type="button"
                  className="w-full mt-6 py-2.5 bg-wedding-navy hover:bg-[#800020] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md text-center"
                >
                  Entendido
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
