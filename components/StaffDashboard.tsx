'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, QrCode, Table2, Database,
  Music, Gift, Users, ChevronRight, LogOut,
  Sparkles, Download, Trash2, Plus, Check,
  Search, SlidersHorizontal, Send, Eye, Phone,
  MessageSquare, Heart, Camera, X, Award, EyeOff,
  Crown, ExternalLink, Copy, FileText, Bell
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import dynamic from 'next/dynamic';
import ExportModal from './ExportModal';
import InviteModal from './InviteModal';
import GuestDetailsModal from './GuestDetailsModal';
import AddGuestModal from './AddGuestModal';

const QRScannerPanel = dynamic(() => import('./QRScannerPanel'), { ssr: false });
const MusicPanel = dynamic(() => import('./MusicPanel'), { ssr: false });
const GiftSequencePanel = dynamic(() => import('./GiftSequencePanel'), { ssr: false });
const GiftSuggestionsPanel = dynamic(() => import('./GiftSuggestionsPanel'), { ssr: false });
const TableVisualPlanner = dynamic(() => import('./TableVisualPlanner'), { ssr: false });
const MemoryBookExporter = dynamic(() => import('./MemoryBookExporter'), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────
interface Companion {
  name: string;
  diet: string;
  dietDetails?: string | null;
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
  tableId: number | null;
  timestamp: string;
  checkIn?: boolean;
  qrCode?: string | null;
  companions?: Companion[];
}

interface Table { id: number; name: string; capacity: number; vip: boolean; }

type Section = 'overview' | 'scanner' | 'tables' | 'database' | 'music' | 'gifts' | 'moderation';

const NAV_ITEMS: { id: Section; label: string; icon: React.FC<any> }[] = [
  { id: 'overview',   label: 'Visão Geral',    icon: LayoutDashboard },
  { id: 'scanner',    label: 'Check-in QR',    icon: QrCode },
  { id: 'tables',     label: 'Mesas',          icon: Table2 },
  { id: 'database',   label: 'Convidados',     icon: Database },
  { id: 'music',      label: 'Playlist',       icon: Music },
  { id: 'gifts',      label: 'Oferendas',      icon: Gift },
  { id: 'moderation', label: 'Mural & Galeria',icon: MessageSquare },
];

interface StaffDashboardProps {
  guests: Guest[];
  tables: Table[];
  tableNames: Record<number, string>;
  tableCount: number;
  onSetTableCount: (n: number) => void;
  onAssignGuest: (guestId: string, tableId: number | null) => void;
  onAutoAllocate: () => void;
  onResetData: () => void;
  onDeleteGuest: (id: string) => void;
  onAddGuest: () => void;
  onAssignTableFromGuest: (guestId: string, tableId: number) => void;
  onSaveTableName: (names: Record<number, string>) => void;
  onLogout: () => void;
  onRefreshGuests: () => void;
  onSimulateUser?: (user: any) => void;
}

export default function StaffDashboard({
  guests, tables, tableNames, tableCount,
  onSetTableCount, onAssignGuest, onAutoAllocate,
  onResetData, onDeleteGuest, onAddGuest,
  onAssignTableFromGuest, onSaveTableName, onLogout, onRefreshGuests,
  onSimulateUser
}: StaffDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  const [showExportModal, setShowExportModal] = useState(false);
  const [inviteGuest, setInviteGuest] = useState<any>(null);
  const [viewGuest, setViewGuest] = useState<any>(null);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll localStorage for staff notifications
  useEffect(() => {
    const fetchNotifs = () => {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('wedding_staff_notifications');
        if (raw) {
          setNotifications(JSON.parse(raw));
        }
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('wedding_staff_notifications', JSON.stringify(updated));
  };

  // Compute World Class Stats
  const totalRsvp = guests.length;
  const confirmedGuests = guests.filter(g => g.status === 'CONFIRMED');
  const pendingGuests = guests.filter(g => g.status === 'PENDING');
  const declinedGuests = guests.filter(g => g.status === 'DECLINED');

  const companionsCount = confirmedGuests.reduce((sum, g) => sum + (g.companions?.length || 0), 0);
  const totalAttending = confirmedGuests.length + companionsCount;

  const checkedIn = guests.filter(g => g.checkIn).length;
  
  // Response Rate
  const responded = guests.filter(g => g.status !== 'PENDING').length;
  const responseRate = totalRsvp > 0 ? Math.round((responded / totalRsvp) * 100) : 0;

  const allocated = confirmedGuests.filter(g => g.tableId !== null).length;
  const unallocated = confirmedGuests.length - allocated;

  const brideCount = confirmedGuests.filter(g => g.side === 'Bride').length;
  const groomCount = confirmedGuests.filter(g => g.side === 'Groom').length;

  const filteredGuests = guests.filter(g => {
    const matchSearch = !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.musicRequest || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSide = filterSide === 'All' || g.side === filterSide;
    return matchSearch && matchSide;
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 selection:bg-[#800020]/15 selection:text-[#800020]">
      
      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-stone-200/60 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-wedding-burgundy fill-wedding-burgundy animate-pulse" />
            <span className="font-serif text-base font-semibold text-wedding-navy">
              Lumiana & Vicente
            </span>
          </div>
          <span className="hidden md:inline text-stone-200 text-xs">|</span>
          <span className="hidden md:inline text-[9px] text-stone-400 font-bold uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded">
            Painel Organizador
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-700">Painel Sincronizado</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(s => !s); if (!showNotifications) markAllRead(); }}
              className="relative p-2 text-stone-500 hover:text-wedding-navy hover:bg-stone-100 rounded-xl transition-all"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Notificações</span>
                  <button onClick={() => setShowNotifications(false)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-stone-400 text-xs">Sem notificações</div>
                  ) : (
                    notifications.slice(0, 15).map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-stone-50 flex items-start gap-3 ${!n.read ? 'bg-emerald-50/40' : ''}`}>
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-stone-800 font-medium leading-snug">{n.message}</p>
                          <span className="text-[9px] text-stone-400 mt-0.5 block">
                            {new Date(n.timestamp).toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all font-semibold border border-transparent hover:border-rose-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed top-16 bottom-0 left-0 w-60 bg-white border-r border-stone-200/60 z-30
            flex flex-col transition-transform duration-300
            lg:static lg:translate-x-0 lg:flex
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-wedding-navy text-white font-bold shadow-md shadow-wedding-navy/10'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar quick overview metrics */}
            <div className="p-4 border-t border-stone-100 shrink-0">
              <div className="bg-stone-50 rounded-2xl p-4 space-y-2.5 border border-stone-100">
                <p className="text-[9px] uppercase font-bold text-stone-400 tracking-widest mb-1.5">Resumo Presença</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Pessoas Confirmadas</span>
                  <span className="font-bold text-stone-800">{totalAttending}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Companheiros</span>
                  <span className="font-semibold text-stone-600">+{companionsCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Taxa de Resposta</span>
                  <span className="font-bold text-wedding-burgundy">{responseRate}%</span>
                </div>
              </div>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-stone-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && (
                <OverviewSection
                  key="overview"
                  guests={guests}
                  totalRsvp={totalRsvp}
                  confirmedCount={confirmedGuests.length}
                  pendingCount={pendingGuests.length}
                  declinedCount={declinedGuests.length}
                  totalAttending={totalAttending}
                  companionsCount={companionsCount}
                  responseRate={responseRate}
                  checkedIn={checkedIn}
                  allocated={allocated}
                  unallocated={unallocated}
                  onAutoAllocate={onAutoAllocate}
                  onOpenExport={() => setShowExportModal(true)}
                  onResetData={onResetData}
                  onNavigate={setActiveSection}
                />
              )}
              {activeSection === 'scanner' && (
                <SectionWrapper key="scanner" title="Check-in QR Code" icon={QrCode} subtitle="Leia o QR Code do convite para registar a entrada do convidado">
                  <QRScannerPanel onScanSuccess={onRefreshGuests} />
                </SectionWrapper>
              )}
              {activeSection === 'tables' && (
                <SectionWrapper key="tables" title="Disposição Visual de Mesas" icon={Table2} subtitle="Aloque convidados confirmados nas mesas visualmente">
                  <TableVisualPlanner 
                    guests={guests} 
                    onAssignGuest={onAssignGuest} 
                    onRefreshGuests={onRefreshGuests}
                  />
                </SectionWrapper>
              )}
              {activeSection === 'database' && (
                <DatabaseSection key="database"
                  guests={filteredGuests} allGuests={guests} tables={tables}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  filterSide={filterSide} setFilterSide={setFilterSide}
                  onDeleteGuest={onDeleteGuest}
                  onAssignTable={onAssignTableFromGuest}
                  onAddGuest={() => setShowAddGuestModal(true)}
                  onInvite={(g: any) => setInviteGuest(g)}
                  onView={(g: any) => setViewGuest(g)}
                  onToggleVip={handleToggleVipGuest}
                  onSimulateUser={onSimulateUser}
                />
              )}
              {activeSection === 'music' && (
                <SectionWrapper key="music" title="Gestão de Playlist" icon={Music} subtitle="Moderar as sugestões e organizar a ordem das músicas">
                  <MusicPanel />
                </SectionWrapper>
              )}
              {activeSection === 'gifts' && (
                <SectionWrapper key="gifts" title="Gestão de Oferendas" icon={Gift} subtitle="Gira a sequência da cerimónia e a lista de itens do Cestão Físico">
                  <GiftSuggestionsPanel />
                  <div className="mt-8">
                    <GiftSequencePanel guestNames={guests.map(g => g.name)} />
                  </div>
                </SectionWrapper>
              )}
              {activeSection === 'moderation' && (
                <SectionWrapper key="moderation" title="Moderação de Mural & Fotos" icon={MessageSquare} subtitle="Gere o Livro de Memórias e modere o conteúdo partilhado pelos convidados">
                  <ModerationPanel />
                </SectionWrapper>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        guests={guests as any}
        tables={tables}
        tableNames={tableNames}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={!!inviteGuest}
        onClose={() => setInviteGuest(null)}
        guest={inviteGuest}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal
        isOpen={!!viewGuest}
        onClose={() => setViewGuest(null)}
        guest={viewGuest}
        onOpenInvite={(g: any) => setInviteGuest(g)}
      />

      {/* Add Guest / Staff Modal */}
      <AddGuestModal
        isOpen={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        onSuccess={onRefreshGuests}
      />
    </div>
  );

  async function handleToggleVipGuest(guest: Guest) {
    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guest.id, vip: !guest.vip }),
      });
      if (res.ok) onRefreshGuests();
    } catch (e) { console.error(e); }
  }
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function SectionWrapper({ title, icon: Icon, subtitle, children }: {
  title: string; icon: React.FC<any>; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="border-b border-stone-200/60 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Icon className="w-5 h-5 text-wedding-burgundy" />
          <h1 className="font-serif text-2xl font-semibold text-wedding-navy">{title}</h1>
        </div>
        {subtitle && <p className="text-xs text-stone-500 font-light">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, color, sub }: {
  icon: React.FC<any>; value: number | string; label: string; color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-200/50 shadow-xs p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-2xl font-bold text-stone-900 tabular-nums leading-none">{value}</p>
        <p className="text-[11px] text-stone-500 mt-1.5 font-semibold leading-tight">{label}</p>
        {sub && <p className="text-[9px] text-stone-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Overview Section ───────────────────────────────────────────────────────────
function OverviewSection({ 
  guests, totalRsvp, confirmedCount, pendingCount, declinedCount, 
  totalAttending, companionsCount, responseRate, checkedIn, 
  allocated, unallocated, onAutoAllocate, onOpenExport, onResetData, onNavigate 
}: any) {
  const recentGuests = [...guests].sort((a: any, b: any) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-[10px] font-bold text-wedding-gold tracking-widest uppercase mb-1">Painel Central</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-wedding-navy">Visão Geral</h1>
          <p className="text-xs text-stone-500 mt-0.5">Mapeamento em tempo real do evento Lumiana & Vicente</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onAutoAllocate}
            className="px-4 py-2 bg-wedding-gold hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Distribuição Automática
          </button>
          <button onClick={onOpenExport}
            className="px-4 py-2 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={onResetData}
            className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Reset Geral
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} value={totalAttending} label="Total Pessoas Presença" color="bg-blue-50 text-blue-600" sub={`Convidados: ${confirmedCount} • Acompanhantes: ${companionsCount}`} />
        <StatCard icon={Check} value={checkedIn} label="Check-in Entrada Feito" color="bg-emerald-50 text-emerald-600" sub={`${totalAttending - checkedIn} em falta no evento`} />
        <StatCard icon={Table2} value={allocated} label="Sentados em Mesas" color="bg-amber-50 text-amber-600" sub={`${unallocated} convidados sem mesa`} />
        <StatCard icon={Award} value={`${responseRate}%`} label="Taxa Geral Resposta" color="bg-rose-50 text-rose-600" sub={`Confirmados: ${confirmedCount} • Pendentes: ${pendingCount} • Recusas: ${declinedCount}`} />
      </div>

      {/* Quick Navigation grid */}
      <div className="text-left">
        <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Atalhos do Cerimonial</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'scanner', label: 'Check-in QR', icon: QrCode, color: 'text-wedding-navy', bg: 'bg-blue-50' },
            { id: 'tables', label: 'Gerir Mesas', icon: Table2, color: 'text-amber-700', bg: 'bg-amber-50' },
            { id: 'database', label: 'Convidados', icon: Database, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { id: 'music', label: 'Playlist', icon: Music, color: 'text-purple-700', bg: 'bg-purple-50' },
            { id: 'gifts', label: 'Oferendas', icon: Gift, color: 'text-rose-700', bg: 'bg-rose-50' },
            { id: 'moderation', label: 'Mural & Fotos', icon: MessageSquare, color: 'text-[#800020]', bg: 'bg-rose-50/60' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id as Section)}
                className="bg-white border border-stone-200/50 hover:border-stone-300 hover:shadow-xs rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all group cursor-pointer gap-2 min-h-[100px]">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent guests list */}
      <div className="bg-white rounded-3xl border border-stone-200/60 overflow-hidden shadow-xs text-left">
        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
          <h2 className="font-serif text-sm font-semibold text-stone-800">Convidados Recentes (Respostas RSVP)</h2>
          <button onClick={() => onNavigate('database')}
            className="text-xs text-wedding-navy hover:underline font-semibold cursor-pointer">Ver todos →</button>
        </div>
        <div className="divide-y divide-stone-100">
          {recentGuests.length === 0 ? (
            <p className="text-center py-8 text-stone-400 text-xs">Nenhum convidado ainda.</p>
          ) : recentGuests.map((g: any) => (
            <div key={g.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50/50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                g.side === 'Bride' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {g.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate">{g.name}</p>
                <div className="flex gap-2 items-center text-[9px] text-stone-400 mt-0.5">
                  <span>{g.side === 'Bride' ? 'Noiva' : 'Noivo'}</span>
                  <span>•</span>
                  <span>{g.tableId ? `Mesa ${g.tableId}` : 'Sem mesa'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                  g.status === 'CONFIRMED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : g.status === 'DECLINED' 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-amber-100 text-amber-800'
                }`}>{g.status === 'CONFIRMED' ? 'Confirmado' : g.status === 'DECLINED' ? 'Ausente' : 'Pendente'}</span>
                {g.checkIn && (
                  <span className="text-[8px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Check-in</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Database Section ───────────────────────────────────────────────────────────
function DatabaseSection({ 
  guests, allGuests, tables, searchTerm, setSearchTerm,
  filterSide, setFilterSide, onDeleteGuest, onAssignTable, onAddGuest, onInvite, onView, onToggleVip,
  onSimulateUser
}: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-wedding-burgundy" />
            <h1 className="font-serif text-2xl font-semibold text-wedding-navy">Base de Dados de Convidados</h1>
          </div>
          <p className="text-xs text-stone-500">{allGuests.length} convidados totais registados no portal</p>
        </div>
        
        <button onClick={onAddGuest}
          className="px-4 py-2.5 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Adicionar Convidado
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-xs p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar convidados por nome..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
          />
        </div>
        <div className="flex gap-1 bg-stone-50 border border-stone-200 rounded-xl p-1 shrink-0">
          {(['All', 'Bride', 'Groom'] as const).map(side => (
            <button key={side} onClick={() => setFilterSide(side)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filterSide === side ? 'bg-wedding-navy text-white shadow-sm' : 'text-stone-650 hover:bg-stone-100'
              }`}>
              {side === 'All' ? 'Todos' : side === 'Bride' ? 'Noiva' : 'Noivo'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-200/60 shadow-xs overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200/60">
                <th className="text-left px-5 py-3.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest">Convidado</th>
                <th className="text-left px-4 py-3.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest hidden md:table-cell">Estado RSVP</th>
                <th className="text-left px-4 py-3.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest hidden md:table-cell">Dieta / Alojamento</th>
                <th className="text-left px-4 py-3.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest">Mesa</th>
                <th className="text-left px-4 py-3.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest hidden sm:table-cell">Check-in</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            
            <tbody className="divide-y divide-stone-100">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400 text-xs italic">Nenhum convidado localizado.</td>
                </tr>
              ) : guests.map((g: any) => (
                <tr key={g.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        g.side === 'Bride' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {g.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-stone-850 text-xs">{g.name}</p>
                          {g.vip && (
                            <span title="Convidado VIP">
                              <Crown className="w-3.5 h-3.5 text-wedding-gold fill-wedding-gold" />
                            </span>
                          )}
                          {g.role && g.role !== 'GUEST' && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              g.role === 'MC' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              g.role === 'DJ' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {g.role}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 font-mono">
                          <span className="text-[9px] text-stone-400 font-sans">{g.side === 'Bride' ? '♥ Lado Noiva' : '♦ Lado Noivo'}</span>
                          {g.phone && (
                            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/60 rounded-lg px-2 py-0.5">
                              <span className="text-[9px] text-stone-600 flex items-center gap-0.5 select-all">
                                <Phone className="w-2.5 h-2.5 text-stone-450" /> {g.phone}
                              </span>
                              
                              <div className="flex items-center gap-0.5 border-l border-stone-200/80 pl-1.5 ml-0.5 shrink-0">
                                {/* Copiar Link */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lumianaevicente.com';
                                    navigator.clipboard.writeText(appUrl);
                                    alert(`Link de acesso copiado para ${g.name}!`);
                                  }}
                                  className="p-0.5 text-stone-400 hover:text-wedding-navy hover:bg-stone-200 rounded transition-all cursor-pointer"
                                  title="Copiar Link de Acesso"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                
                                {/* WhatsApp */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firstName = g.name ? g.name.split(' ')[0] : 'Convidado';
                                    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lumianaevicente.com';
                                    const text = `Olá ${firstName}! 🌿\n\n` +
                                      `Temos a alegria de partilhar consigo o convite para o nosso casamento.\n\n` +
                                      `📅 12 de Setembro de 2026\n📍 Maputo\n\n` +
                                      `👉 CLIQUE NESTE LINK PARA ENTRAR E CONFIRMAR:\n` +
                                      `🔗 ${appUrl} 🔗\n\n` +
                                      `Com carinho,\nLumiana & Vicente`;
                                    let phone = g.phone || '';
                                    phone = phone.replace(/\D/g, '');
                                    if (phone.length === 9 && phone.startsWith('8')) {
                                      phone = '258' + phone;
                                    }
                                    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
                                    window.open(url, '_blank');
                                  }}
                                  className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                                  title="Enviar por WhatsApp"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                                
                                {/* PDF */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInvite(g);
                                  }}
                                  className="p-0.5 text-wedding-burgundy hover:bg-rose-50 rounded transition-all cursor-pointer"
                                  title="Ver Convite / Gerar PDF"
                                >
                                  <FileText className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                          {g.role && g.role !== 'GUEST' && (
                            <span className="text-[9px] font-bold text-wedding-burgundy bg-stone-100 px-1.5 py-0.5 rounded">
                              🔑 PIN: {g.phone ? g.phone.slice(-4) : '—'}
                            </span>
                          )}
                        </div>
                        {g.companions && g.companions.length > 0 && (
                          <p className="text-[9px] text-[#800020] font-medium mt-1">
                            👫 +{g.companions.length} acompanhante(s): {g.companions.map((c: any) => c.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                      g.status === 'CONFIRMED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : g.status === 'DECLINED'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      {g.status === 'CONFIRMED' ? 'Confirmado' : g.status === 'DECLINED' ? 'Ausente' : 'Pendente'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 hidden md:table-cell max-w-[200px]">
                    <div className="space-y-1">
                      {g.diet !== 'Nenhuma' && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md block w-fit truncate">
                          🍴 Dieta: {g.diet}
                        </span>
                      )}
                      {(g.needsAccommodation === 'Sim' || g.needsAccommodation === 'Yes') && (
                        <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md block w-fit truncate">
                          🏨 Alojamento
                        </span>
                      )}
                      {g.diet === 'Nenhuma' && g.needsAccommodation !== 'Sim' && g.needsAccommodation !== 'Yes' && (
                        <span className="text-stone-300">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <select
                      value={g.tableId ?? ''}
                      onChange={e => onAssignTable(g.id, e.target.value ? parseInt(e.target.value, 10) : null)}
                      className="text-[10px] bg-stone-50 border border-stone-150 rounded-xl px-2.5 py-1.5 focus:outline-none text-stone-700 min-w-[100px] cursor-pointer"
                    >
                      <option value="">Sem mesa</option>
                      {tables.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {g.checkIn ? (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Presente
                      </span>
                    ) : (
                      <span className="text-stone-350 text-[10px]">Não efetuado</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onView(g)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer" title="Ficha do Convidado">
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {(!g.role || g.role === 'GUEST') && (
                        <button onClick={() => onToggleVip(g)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${g.vip ? 'text-wedding-gold hover:bg-amber-50' : 'text-stone-300 hover:text-wedding-gold hover:bg-stone-100'}`} title="Marcar/Desmarcar VIP">
                          <Crown className="w-4 h-4" />
                        </button>
                      )}

                      {g.role && g.role !== 'GUEST' && onSimulateUser && (
                        <button onClick={() => onSimulateUser(g)}
                          className="p-1.5 text-wedding-gold hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title="Aceder ao Portal deste Staff">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {/* Copiar Link de Acesso */}
                      <button onClick={() => {
                        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lumianaevicente.com';
                        navigator.clipboard.writeText(appUrl);
                        alert(`Link de acesso copiado para ${g.name}!`);
                      }}
                        className="p-1.5 text-stone-500 hover:text-wedding-navy hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Copiar Link de Acesso">
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* WhatsApp Direto */}
                      <button onClick={() => {
                        const firstName = g.name ? g.name.split(' ')[0] : 'Convidado';
                        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lumianaevicente.com';
                        const text = `Olá ${firstName}! 🌿\n\n` +
                          `Temos a alegria de partilhar consigo o convite para o nosso casamento.\n\n` +
                          `📅 12 de Setembro de 2026\n📍 Maputo\n\n` +
                          `👉 CLIQUE NESTE LINK PARA ENTRAR E CONFIRMAR:\n` +
                          `🔗 ${appUrl} 🔗\n\n` +
                          `Com carinho,\nLumiana & Vicente`;
                        let phone = g.phone || '';
                        phone = phone.replace(/\D/g, '');
                        if (phone.length === 9 && phone.startsWith('8')) {
                          phone = '258' + phone;
                        }
                        const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Enviar por WhatsApp">
                        <Send className="w-4 h-4" />
                      </button>

                      {/* Abrir Modal de PDF */}
                      <button onClick={() => onInvite(g)}
                        className="p-1.5 text-wedding-burgundy hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Ver Convite / Gerar PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                      
                      <button onClick={() => onDeleteGuest(g.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ── Moderation Panel Section ───────────────────────────────────────────────────
function ModerationPanel() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        fetch('/api/gallery'),
        fetch('/api/wall')
      ]);
      const pData = await pRes.json();
      const mData = await mRes.json();
      
      if (pData.success) setPhotos(pData.photos);
      if (mData.success) setMessages(mData.messages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoApprove = async (id: string, approved: boolean) => {
    try {
      const res = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved }),
      });
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === id ? { ...p, approved } : p));
      }
    } catch (e) { console.error(e); }
  };

  const handlePhotoDelete = async (id: string) => {
    if (!confirm('Eliminar esta fotografia definitivamente?')) return;
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleMessageApprove = async (id: string, approved: boolean) => {
    try {
      const res = await fetch('/api/wall', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved }),
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, approved } : m));
      }
    } catch (e) { console.error(e); }
  };

  const handleMessageDelete = async (id: string) => {
    if (!confirm('Eliminar esta mensagem definitivamente?')) return;
    try {
      const res = await fetch(`/api/wall?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Printable Memory Book widget */}
      <MemoryBookExporter />

      {loading ? (
        <div className="text-center py-16 text-stone-400">A carregar itens do mural e galeria...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Photos Moderation Panel */}
          <div className="bg-white rounded-3xl border border-stone-200/60 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
                <Camera className="w-4 h-4 text-wedding-burgundy" />
                <h4 className="font-serif text-base text-wedding-navy">Galeria Colaborativa</h4>
                <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded font-mono ml-auto">
                  {photos.filter(p => !p.approved).length} pendentes
                </span>
              </div>

              {photos.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-8">Nenhuma fotografia carregada ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-stone-200 group bg-stone-50">
                      <img src={photo.url} className="w-full h-24 object-cover" />
                      <div className="p-2 flex items-center justify-between bg-white text-[10px]">
                        <span className="truncate font-semibold text-stone-600 max-w-[80px]" title={photo.uploadedBy}>
                          {photo.uploadedBy}
                        </span>
                        
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handlePhotoApprove(photo.id, !photo.approved)}
                            className={`p-1 rounded transition-colors ${
                              photo.approved 
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                                : 'text-stone-400 bg-stone-100 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={photo.approved ? 'Desaprovar' : 'Aprovar'}
                          >
                            {photo.approved ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          
                          <button
                            onClick={() => handlePhotoDelete(photo.id)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 bg-stone-100 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Moderation Panel */}
          <div className="bg-white rounded-3xl border border-stone-200/60 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
                <MessageSquare className="w-4 h-4 text-wedding-burgundy" />
                <h4 className="font-serif text-base text-wedding-navy">Mensagens do Mural</h4>
                <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded font-mono ml-auto">
                  {messages.length} mensagens
                </span>
              </div>

              {messages.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-8">Nenhuma mensagem no mural ainda.</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {messages.map(msg => (
                    <div key={msg.id} className="bg-stone-50 border border-stone-150 rounded-xl p-3 text-xs flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="italic text-stone-700 leading-relaxed">&ldquo;{msg.content}&rdquo;</p>
                        <p className="text-[10px] font-bold text-wedding-navy mt-1.5">— {msg.guestName}</p>
                      </div>
                      
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={() => handleMessageApprove(msg.id, !msg.approved)}
                          className={`p-1 rounded transition-colors ${
                            msg.approved 
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                              : 'text-stone-400 bg-stone-100 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={msg.approved ? 'Esconder do Mural' : 'Mostrar no Mural'}
                        >
                          {msg.approved ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleMessageDelete(msg.id)}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 bg-stone-100 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
