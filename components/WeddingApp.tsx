'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Heart, Calendar, MapPin, Music, Utensils, Home, 
  Users, Sparkles, Send, Download, Plus, Trash2, 
  Lock, Check, MessageSquare, X, ArrowRight, Printer, 
  Compass, Volume2, Camera, Upload, Gift, BookOpen,
  CheckCircle2, User, Bell
} from 'lucide-react';
import dynamic from 'next/dynamic';

import WelcomeScreen from './WelcomeScreen';
import RsvpForm from './RsvpForm';
import GuestCenter from './GuestCenter';
import DigitalWall from './DigitalWall';
import CollaborativeGallery from './CollaborativeGallery';
import MusicRequestWidget from './MusicRequestWidget';

const StaffDashboard = dynamic(() => import('./StaffDashboard'), { ssr: false });
const DJDashboard = dynamic(() => import('./DJDashboard'), { ssr: false });
const MCDashboard = dynamic(() => import('./MCDashboard'), { ssr: false });
const PhotographerDashboard = dynamic(() => import('./PhotographerDashboard'), { ssr: false });

interface Companion {
  name: string;
  diet: string;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  side: 'Bride' | 'Groom';
  role?: string;
  status: string; // PENDING, CONFIRMED, DECLINED
  vip: boolean;
  diet: string;
  dietDetails: string;
  musicRequest: string;
  needsAccommodation: 'Yes' | 'No' | 'Sim' | 'Não';
  accommodationDetails: string;
  giftDeliveryMethod?: string | null;
  tableId: number | null;
  timestamp: string;
  checkIn?: boolean;
  qrCode?: string | null;
  companions?: Companion[];
}

interface DBTable {
  id: number;
  name: string;
  capacity: number;
  vip: boolean;
}

export default function WeddingPlannerApp({ user, onLogout, onLogin }: { user?: any, onLogout?: () => void, onLogin?: (user: any) => void }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [dbTables, setDbTables] = useState<DBTable[]>([]);
  const [currentUser, setCurrentUser] = useState<Guest | null>(
    user && user.role === 'GUEST' ? user : null
  );
  
  // Welcome screen gate
  const [hasEntered, setHasEntered] = useState(false);
  
  // Tab Navigation for Guest Site
  const [activeTab, setActiveTab] = useState<'site' | 'rsvp' | 'mural' | 'presentes'>('site');
  const [giftSuggestions, setGiftSuggestions] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastId = localStorage.getItem('wedding_last_processed_broadcast_id') || '';

    const checkBroadcasts = () => {
      const saved = localStorage.getItem('wedding_broadcast_notifications');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) {
            const latest = list[0];
            if (latest.id !== lastId) {
              lastId = latest.id;
              localStorage.setItem('wedding_last_processed_broadcast_id', latest.id);

              // 1. Show in-app Toast
              setActiveToast({ id: latest.id, text: latest.text });
              setTimeout(() => {
                setActiveToast(null);
              }, 6000);

              // 2. Show browser native notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification("Mensagem dos Noivos 🌿", {
                  body: latest.text,
                  icon: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=128',
                });
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    checkBroadcasts();
    const interval = setInterval(checkBroadcasts, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/gift-suggestions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.suggestions?.length > 0) {
          setGiftSuggestions(data.suggestions);
        } else {
          setGiftSuggestions([
            { id: 'g-1', name: 'Micro-ondas', icon: '♨️', desc: 'Para facilitar o dia a dia.' },
            { id: 'g-2', name: 'Liquidificador', icon: '🍹', desc: 'Ideal para prepararmos sumos.' },
            { id: 'g-3', name: 'Faqueiro Completo', icon: '🍴', desc: 'Para servirmos os convidados com elegância.' },
            { id: 'g-4', name: 'Aparelho de Jantar', icon: '🍽️', desc: 'Conjunto de pratos e louça para as refeições.' },
            { id: 'g-5', name: 'Jogo de Panelas', icon: '🍲', desc: 'Essencial para começarmos a cozinhar juntos.' },
            { id: 'g-6', name: 'Ferro de Engomar', icon: '👔', desc: 'Um clássico indispensável para a nova casa.' },
            { id: 'g-7', name: 'Máquina de Café', icon: '☕', desc: 'Para começar as manhãs com muita energia.' },
            { id: 'g-8', name: 'Aspirador de Pó', icon: '🧹', desc: 'Para nos ajudar nas limpezas do lar.' },
            { id: 'g-9', name: 'Jogo de Toalhas', icon: '🛁', desc: 'Toalhas macias para uso diário.' },
          ]);
        }
      })
      .catch(e => console.error(e));
  }, []);

  // Photo customization states
  const [heroPhoto, setHeroPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_hero_photo');
      if (saved) return saved;
    }
    return "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200";
  });

  const [storyPhoto, setStoryPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_story_photo');
      if (saved) return saved;
    }
    return "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600";
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Chatbot Assistant States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual do casamento de Lumiana e Vicente. 💖 Estou aqui para ajudar com qualquer dúvida sobre localização, trajes, presentes, hotel ou horários do grande dia. Como posso te ajudar hoje?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Countdown timer calculations
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchGuests();
    fetchTables();
  }, []);

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

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  const [showCheckInOverlay, setShowCheckInOverlay] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string>('');
  const prevCheckInRef = useRef<boolean>(user?.checkIn || false);

  // Sync check-in in real-time by polling (for guests waiting for checkin or staff dashboard)
  useEffect(() => {
    const isGuestPendingCheckin = currentUser && currentUser.role === 'GUEST' && !currentUser.checkIn;
    const isStaff = user && user.role === 'STAFF';

    if (!isGuestPendingCheckin && !isStaff) return;

    const interval = setInterval(() => {
      fetchGuests();
    }, isStaff ? 3000 : 4000);

    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.checkIn, user]);

  // Handle overlay trigger on status change
  useEffect(() => {
    if (currentUser && currentUser.role === 'GUEST') {
      if (currentUser.checkIn && !prevCheckInRef.current) {
        setShowCheckInOverlay(true);
        setCheckInTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      prevCheckInRef.current = currentUser.checkIn || false;
    }
  }, [currentUser?.checkIn]);

  const getTableLocation = (tableId: number | null | undefined, isVip: boolean) => {
    if (!tableId) return "Aguarde a definição de mesa na recepção.";
    if (isVip) return "Ala de Honra: Próxima à mesa presidencial de Lumiana e Vicente.";
    if (tableId % 2 === 0) {
      return "Ala Esquerda do Salão: Siga pelo corredor esquerdo em direção ao jardim suspenso.";
    } else {
      return "Ala Direita do Salão: Siga pelo corredor direito próximo ao piano de cauda.";
    }
  };

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/guests');
      const data = await res.json();
      if (res.ok && data.success) {
        setGuests(data.guests);
        // Sync current user details if logged in
        if (currentUser) {
          const updated = data.guests.find((g: Guest) => g.id === currentUser.id);
          if (updated) setCurrentUser(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (res.ok && data.success) {
        setDbTables(data.tables);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTableCompanions = (currentGuest: Guest | null, allGuests: Guest[]) => {
    if (!currentGuest || !currentGuest.tableId) return [];
    
    const tableGuests = allGuests.filter(
      g => g.tableId === currentGuest.tableId && g.status === 'CONFIRMED'
    );
    
    const companionsList: string[] = [];
    
    tableGuests.forEach(g => {
      // Add the guest themselves if not current user
      if (g.id !== currentGuest.id) {
        companionsList.push(g.name);
      }
      
      // Add their companions
      if (g.companions && g.companions.length > 0) {
        g.companions.forEach(c => {
          companionsList.push(`${c.name} (Acomp. de ${g.name.split(' ')[0]})`);
        });
      }
    });

    // Also add current user's companions (since they are sitting at the same table!)
    if (currentGuest.companions && currentGuest.companions.length > 0) {
      currentGuest.companions.forEach(c => {
        companionsList.push(`${c.name} (Seu Acompanhante)`);
      });
    }
    
    return companionsList;
  };

  const assignGuestToTable = async (guestId: string, tableId: number | null) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guestId, tableId }),
      });
      if (res.ok) {
        fetchGuests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoAllocate = async () => {
    // Call server/local auto allocation
    const unallocated = guests.filter(g => g.tableId === null && g.status === 'CONFIRMED');
    if (unallocated.length === 0) {
      alert('Todos os convidados confirmados já estão alocados!');
      return;
    }

    let allocatedCount = 0;
    for (const table of dbTables) {
      const currentCount = guests.filter(g => g.tableId === table.id).length;
      const available = table.capacity - currentCount;
      
      for (let i = 0; i < available && allocatedCount < unallocated.length; i++) {
        const guest = unallocated[allocatedCount];
        await fetch('/api/guests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: guest.id, tableId: table.id }),
        });
        allocatedCount++;
      }
      if (allocatedCount >= unallocated.length) break;
    }

    fetchGuests();
    alert(`Alocação inteligente concluída! ${allocatedCount} convidados alocados.`);
  };

  const handleResetData = async () => {
    if (!confirm('Esta ação irá limpar e re-semear todos os dados da base de dados Supabase para o estado padrão. Tem certeza?')) return;
    try {
      // Re-trigger seed
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'reset_seed_db' }), // Mapped to seed trigger in verification API
      });
      if (res.ok) {
        fetchGuests();
        fetchTables();
        alert('Base de dados re-semeada com sucesso!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Remover este convidado definitivamente?')) return;
    try {
      const res = await fetch(`/api/guests?id=${guestId}`, { method: 'DELETE' });
      if (res.ok) fetchGuests();
    } catch (e) { console.error(e); }
  };

  // Chatbot FAQ Query handler
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim()) return;

    const updatedMessages = [
      ...chatMessages,
      { role: 'user' as const, content: promptToSend.trim() }
    ];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.message || 'Desculpe, não consegui responder.' }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Ops, tive um problema de conexão. Tente novamente em breve!' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };



  // If user is Staff, bypass Welcome screen and render StaffDashboard
  if (user && user.role === 'STAFF') {
    return (
      <StaffDashboard
        guests={guests}
        tables={dbTables}
        tableNames={dbTables.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {})}
        tableCount={dbTables.length}
        onSetTableCount={(n) => {}}
        onAssignGuest={assignGuestToTable}
        onAutoAllocate={handleAutoAllocate}
        onResetData={handleResetData}
        onDeleteGuest={handleDeleteGuest}
        onAddGuest={fetchGuests}
        onAssignTableFromGuest={assignGuestToTable}
        onSaveTableName={() => {}}
        onLogout={onLogout ?? (() => {})}
        onRefreshGuests={fetchGuests}
        onSimulateUser={onLogin}
      />
    );
  }

  // If user is MC (Mestre de Cerimónias), render MCDashboard
  if (user && user.role === 'MC') {
    return (
      <MCDashboard
        onLogout={onLogout ?? (() => {})}
      />
    );
  }

  // If user is DJ, render DJDashboard
  if (user && user.role === 'DJ') {
    return (
      <DJDashboard
        onLogout={onLogout ?? (() => {})}
      />
    );
  }

  // If user is PHOTOGRAPHER, render PhotographerDashboard
  if (user && user.role === 'PHOTOGRAPHER') {
    return (
      <PhotographerDashboard
        onLogout={onLogout ?? (() => {})}
      />
    );
  }

  // Welcome Screen Gate
  if (!hasEntered && currentUser) {
    return (
      <WelcomeScreen
        guest={currentUser}
        heroPhoto={heroPhoto}
        onEnter={() => setHasEntered(true)}
      />
    );
  }

  // Guest Assigned Table Name
  const assignedTable = dbTables.find(t => t.id === currentUser?.tableId);
  const guestTableName = assignedTable ? assignedTable.name : '';

  return (
    <div className="min-h-screen flex flex-col relative bg-[#FDFCFB]">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100 h-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-wedding-burgundy fill-wedding-burgundy animate-pulse" />
          <span className="font-serif text-xl font-semibold text-wedding-navy tracking-wide">
            Lumiana <span className="text-wedding-gold font-light">&</span> Vicente
          </span>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <span className="text-xs text-stone-500 font-medium hidden sm:block">
              Olá, {currentUser.companions?.[0]?.name 
                ? `${currentUser.name.split(' ')[0]} & ${currentUser.companions[0].name.split(' ')[0]}`
                : currentUser.name.split(' ')[0]}
            </span>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-inner"
            >
              <Lock className="w-3 h-3" /> Sair
            </button>
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs bar */}
        <div className="flex justify-center border-b border-stone-200/60 pb-3 gap-6">
          {[
            { id: 'site', label: 'O Casamento' },
            { id: 'rsvp', label: 'RSVP / Meu Portal' },
            { id: 'mural', label: 'Mural & Fotos' },
            { id: 'presentes', label: 'Lista de Casamento' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-wedding-burgundy text-wedding-burgundy'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: WEBSITE HOME */}
          {activeTab === 'site' && (
            <motion.div
              key="site-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Cover/Hero card */}
              <div className="lg:col-span-8 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-xs min-h-[460px]">
                <div className="absolute inset-0 z-0">
                  <img src={heroPhoto} alt="Lumiana & Vicente" className="w-full h-full object-cover filter brightness-[0.4]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-[#001B3D]/20 to-transparent" />
                </div>
                <div className="relative z-10 text-white mt-auto text-left">
                  <span className="text-[#C5A880] uppercase tracking-[0.3em] font-semibold text-xs border-b border-[#C5A880]/30 pb-1 inline-block">A Celebração</span>
                  <h1 className="text-4xl md:text-6xl font-serif mt-5 text-white leading-tight">Lumiana & Vicente</h1>
                  <p className="text-stone-300 text-xs md:text-sm font-serif italic mt-3 max-w-md">
                    "Duas vidas, um só caminho de fé, serviço e amor eterno que se inicia para toda a eternidade."
                  </p>
                </div>
              </div>

              {/* Countdown panel */}
              <div className="lg:col-span-4 bg-[#001B3D] rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                <div className="text-left">
                  <h3 className="text-xs font-serif italic tracking-wider text-[#C5A880] mb-4">Save the Date</h3>
                  <p className="text-stone-300 text-xs mb-3">Aguardando ansiosamente com contagem regressiva para o nosso grande dia:</p>
                  <p className="text-[#C5A880] text-xl font-serif font-bold tracking-wide mb-6">12 de Setembro de 2026</p>
                  
                  <div className="grid grid-cols-4 gap-1.5 text-center mb-8">
                    {[{ v: timeLeft.days, l: 'Dias' }, { v: timeLeft.hours, l: 'Horas' }, { v: timeLeft.minutes, l: 'Min' }, { v: timeLeft.seconds, l: 'Seg' }].map((item, i) => (
                      <div key={i} className="bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="text-lg md:text-xl font-serif text-[#C5A880] block font-bold">{item.v}</span>
                        <span className="text-[8px] uppercase tracking-wider text-stone-300 block mt-0.5">{item.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setActiveTab('rsvp')}
                  className="w-full py-4 bg-[#800020] hover:bg-[#500312] text-white rounded-xl text-xs font-semibold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  Confirmar <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Our Love Story */}
              <div className="lg:col-span-8 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-8 text-left shadow-xs">
                <span className="text-[#800020] uppercase tracking-[0.25em] font-semibold text-[9px] border-b border-[#800020]/20 pb-1 inline-block mb-4">Nossa História</span>
                <h3 className="font-serif text-2xl text-[#001B3D] mb-6 font-normal">O Começo da Nossa Eternidade</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-5 relative h-48 md:h-60 rounded-2xl overflow-hidden shadow-xs">
                    <img src={storyPhoto} alt="Lumiana & Vicente" className="w-full h-full object-cover" />
                  </div>
                  <div className="md:col-span-7 text-xs text-stone-600 space-y-3.5 leading-relaxed font-light">
                    <p>O que começou com uma profunda amizade e cumplicidade floresceu no amor mais sincero. Percebemos que as nossas vidas faziam mais sentido quando caminhávamos lado a lado.</p>
                    <p className="font-serif italic text-[#800020] border-l-2 border-[#C5A880] pl-3 py-1.5 font-medium text-[11px] leading-relaxed">
                      "O casamento é uma parceria de iguais, trabalhando juntos para edificar um lar centrado no amor, respeito e compromisso mútuo."
                    </p>
                    <p>Hoje, damos este passo sagrado com a certeza de que o nosso amor é eterno. Agradecemos a cada um de vocês por partilhar deste dia inesquecível connosco!</p>
                  </div>
                </div>
              </div>

              {/* Ceremony details */}
              <div className="lg:col-span-4 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-8 text-left shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[#800020] uppercase tracking-[0.25em] font-semibold text-[9px] border-b border-[#800020]/20 pb-1 inline-block mb-4">Agenda do Dia</span>
                  <h3 className="font-serif text-2xl text-[#001B3D] mb-6 font-normal">Local & Horários</h3>
                  
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#001B3D]/5 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-[#800020]" />
                      </div>
                      <div>
                        <strong className="text-xs text-[#001B3D] block font-serif">Capela da Polana, Maputo</strong>
                        <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">Avenida Julius Nyerere, Polana Cimento • Maputo</span>
                        <a
                          href="https://maps.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-bold text-[#800020] uppercase tracking-wider mt-1.5 block hover:underline"
                        >
                          Abrir no Google Maps →
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#001B3D]/5 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-[#800020]" />
                      </div>
                      <div>
                        <strong className="text-xs text-[#001B3D] block font-serif">Cronograma do Evento</strong>
                        <span className="text-[10px] text-stone-500 block leading-relaxed mt-0.5">
                          12:00 — Cerimónia Religiosa<br />
                          13:30 — Cocktail de Boas-Vindas<br />
                          15:00 — Almoço & Discursos<br />
                          17:00 — Abertura da Pista de Dança
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-150 pt-4 mt-6">
                  <span className="text-[9px] uppercase font-bold text-stone-400 block">Código de Vestuário</span>
                  <span className="text-xs font-serif font-semibold text-wedding-navy mt-1 block">Formal / Gala Elegante</span>
                </div>
              </div>

              {/* Music Request Widget on Main Screen */}
              {currentUser && (
                <div className="lg:col-span-12 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-8 shadow-xs">
                  <div className="max-w-xl mx-auto">
                    <MusicRequestWidget
                      currentMusic={currentUser.musicRequest || undefined}
                      userId={currentUser.id}
                      userName={currentUser.name}
                      onMusicSaved={(newMusic) => {
                        const updated = { ...currentUser, musicRequest: newMusic };
                        setCurrentUser(updated);
                        setGuests(prev => prev.map(g => g.id === currentUser.id ? updated : g));
                        localStorage.setItem('wedding_user_session', JSON.stringify(updated));
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: RSVP / GUEST PORTAL */}
          {activeTab === 'rsvp' && (
            <motion.div
              key="rsvp-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto w-full"
            >
              {currentUser && (currentUser.status === 'CONFIRMED' || currentUser.status === 'DECLINED') ? (
                <GuestCenter
                  guest={currentUser as any}
                  tableName={guestTableName}
                  tableCompanions={getTableCompanions(currentUser, guests)}
                  giftSuggestions={giftSuggestions}
                  onUpdateGuest={(updated: any) => {
                    setCurrentUser(updated);
                    fetchGuests();
                  }}
                  onLogout={onLogout ?? (() => {})}
                />
              ) : (
                currentUser && (
                  <RsvpForm
                    guest={currentUser}
                    onRsvpSubmitted={(updated) => {
                      setCurrentUser(updated);
                      fetchGuests();
                    }}
                  />
                )
              )}
            </motion.div>
          )}

          {/* TAB 3: MURAL & PHOTO GALLERY */}
          {activeTab === 'mural' && (
            <motion.div
              key="mural-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Collaborative photo gallery */}
              <CollaborativeGallery currentUser={currentUser || undefined} />
              
              {/* Congratulations wall */}
              <DigitalWall currentUser={currentUser || undefined} />
            </motion.div>
          )}

          {/* TAB 4: GIFT LIST (CESTÃO) */}
          {activeTab === 'presentes' && (
            <motion.div
              key="presentes-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-8 text-center max-w-xl mx-auto shadow-xs">
                <Gift className="w-10 h-10 text-wedding-gold mx-auto mb-4" />
                <h3 className="font-serif text-xl text-wedding-navy mb-2">Lista de Presentes (Cestão)</h3>
                <p className="text-stone-600 text-xs leading-relaxed max-w-md mx-auto">
                  A nossa maior prenda é a sua presença. Contudo, se deseja presentear-nos fisicamente, disponibilizaremos um <strong>Cestão no dia do evento</strong>. Para facilitar, criámos esta pequena lista com algumas sugestões de itens essenciais de casa que ainda nos fazem falta.
                </p>
              </div>

              {/* Gift Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {giftSuggestions.map(gift => (
                  <div
                    key={gift.id}
                    className="bg-white border border-stone-150 hover:border-wedding-gold rounded-2xl p-5 shadow-xs flex flex-col hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="text-3xl mb-3">{gift.icon}</div>
                    <h4 className="font-semibold text-sm text-stone-850 group-hover:text-wedding-navy transition-colors">{gift.name}</h4>
                    <p className="text-[10px] text-stone-400 mt-1 leading-normal">{gift.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating AI Chatbot component */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="guest-ai-chatbot">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.93 }}
              className="bg-white rounded-3xl w-[350px] sm:w-[410px] h-[520px] shadow-2xl border border-stone-150 flex flex-col overflow-hidden text-stone-900"
            >
              {/* Header */}
              <div className="bg-[#001B3D] px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-wedding-gold animate-pulse fill-wedding-gold" />
                  <div>
                    <h3 className="font-serif text-sm font-semibold tracking-wide">Assistente Lumiana & Vicente</h3>
                    <p className="text-[10px] text-stone-300">Inteligência Artificial para convidados</p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FDFCFB]/70 scrollbar-none">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#800020] text-white rounded-br-none'
                          : 'bg-stone-100 text-[#001B3D] rounded-bl-none border border-stone-200/50'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3 rounded-bl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#800020]/65 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#800020]/80 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-[#800020] rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Presets chips */}
              <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {[
                  { label: '📍 Localização?', text: 'Onde será realizado o casamento?' },
                  { label: '👗 Dress code?', text: 'Qual é o traje recomendado?' },
                  { label: '🎁 Presentes?', text: 'Como funciona a lista de presentes?' },
                  { label: '🏨 Hotéis?', text: 'Onde posso me hospedar perto?' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, chip.text)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-stone-200 hover:border-[#800020] hover:text-[#800020] rounded-full text-[10px] font-semibold text-stone-600 transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-stone-100 flex items-center gap-2 bg-white shrink-0"
              >
                <input
                  type="text"
                  placeholder="Pergunte sobre dress code, hotéis, horários..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#800020] text-stone-850"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-10 h-10 rounded-xl bg-wedding-navy hover:bg-[#800020] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 bg-[#800020] hover:bg-[#500312] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
        </button>
      </div>



      {/* Check-in Success Real-time Synchronized Overlay */}
      <AnimatePresence>
        {showCheckInOverlay && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckInOverlay(false)}
              className="fixed inset-0 bg-stone-900/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#F3FAF6] border-2 border-[#10B981] rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10 text-stone-900 text-left animate-fade-in"
            >
              {/* Elegant Close Button */}
              <button
                onClick={() => setShowCheckInOverlay(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Status Header */}
              <div className="flex items-start gap-3.5 mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#065F46]">
                    Check-in Confirmado ✓
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {checkInTime || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Guest Details */}
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="font-bold text-stone-900 text-base">{currentUser.name}</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  currentUser.side === 'Bride'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {currentUser.side === 'Bride' ? '♥ Noiva' : '♦ Noivo'}
                </span>
              </div>

              {/* Table details */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-sm text-stone-750">Mesa <strong className="text-base text-stone-900 font-bold">{guestTableName || currentUser.tableId || 'Não definida'}</strong></span>
              </div>

              {/* Yellow Alert Box */}
              <div className="bg-[#FEF9E7] border border-[#FDE68A] rounded-xl p-4 text-xs font-semibold text-amber-800 leading-relaxed mb-5">
                {currentUser.name}, o seu check-in {currentUser.checkIn && prevCheckInRef.current ? 'já havia sido realizado' : 'foi realizado com sucesso'}. Seja bem-vindo(a){currentUser.checkIn && prevCheckInRef.current ? ' novamente' : ''}! Mesa: {currentUser.tableId || 'Não definida'}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowCheckInOverlay(false)}
                className="w-full py-3 bg-white hover:bg-stone-50 border border-stone-250 text-stone-650 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Aceder ao Meu Portal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-500 py-12 border-t border-stone-850 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <Heart className="w-5 h-5 text-wedding-burgundy fill-wedding-burgundy mx-auto animate-pulse" />
          <h4 className="font-serif text-lg text-white tracking-widest">Lumiana & Vicente</h4>
          <p className="text-[10px] uppercase tracking-wider text-stone-600">Maputo • 12 de Setembro de 2026</p>
          <div className="w-12 h-[1px] bg-wedding-gold/20 mx-auto" />
          <p className="text-[10px] font-light max-w-sm mx-auto leading-relaxed">
            © 2026 Casamento de Lumiana & Vicente. Desenvolvido com muito romance e sofisticação para marcar o começo da eternidade.
          </p>
        </div>
      </footer>

      {/* Premium Notification Toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-55 w-full max-w-sm px-4"
          >
            <div className="bg-[#800020]/95 backdrop-blur-md text-white border border-[#C5A880]/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A880]" />
              
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-wedding-gold animate-bounce" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-[9px] uppercase tracking-widest text-[#C5A880] font-bold block mb-0.5">Mensagem dos Noivos</span>
                <p className="text-xs font-medium leading-relaxed text-stone-100">{activeToast.text}</p>
              </div>
              <button
                onClick={() => setActiveToast(null)}
                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
