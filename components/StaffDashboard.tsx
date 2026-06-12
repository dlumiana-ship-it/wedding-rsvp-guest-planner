'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, QrCode, Table2, Database,
  Music, Gift, Users, ChevronRight, LogOut,
  Sparkles, Download, Trash2, Plus, Check,
  Search, SlidersHorizontal, Send, Eye, Phone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import dynamic from 'next/dynamic';
import ExportModal from './ExportModal';
import InviteModal from './InviteModal';
import GuestDetailsModal from './GuestDetailsModal';

const QRScannerPanel = dynamic(() => import('./QRScannerPanel'), { ssr: false });
const MusicPanel = dynamic(() => import('./MusicPanel'), { ssr: false });
const GiftSequencePanel = dynamic(() => import('./GiftSequencePanel'), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────
interface Guest {
  id: string;
  name: string;
  phone?: string;
  side: 'Bride' | 'Groom';
  role?: string;
  diet: string;
  dietDetails: string;
  musicRequest: string;
  needsAccommodation: 'Yes' | 'No';
  accommodationDetails: string;
  tableId: number | null;
  timestamp: string;
  checkIn?: boolean;
  qrCode?: string | null;
}

interface Table { id: number; name: string; }

type Section = 'overview' | 'scanner' | 'tables' | 'database' | 'music' | 'gifts';

// ── Nav items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Section; label: string; icon: React.FC<any>; badge?: string }[] = [
  { id: 'overview',  label: 'Visão Geral',    icon: LayoutDashboard },
  { id: 'scanner',   label: 'Check-in QR',    icon: QrCode },
  { id: 'tables',    label: 'Mesas',           icon: Table2 },
  { id: 'database',  label: 'Convidados',      icon: Database },
  { id: 'music',     label: 'Playlist',        icon: Music },
  { id: 'gifts',     label: 'Oferendas',       icon: Gift },
];

// ── Props ──────────────────────────────────────────────────────────────────────
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
}

export default function StaffDashboard({
  guests, tables, tableNames, tableCount,
  onSetTableCount, onAssignGuest, onAutoAllocate,
  onResetData, onDeleteGuest, onAddGuest,
  onAssignTableFromGuest, onSaveTableName, onLogout,
}: StaffDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  const [showExportModal, setShowExportModal] = useState(false);
  const [inviteGuest, setInviteGuest] = useState<any>(null);
  const [viewGuest, setViewGuest] = useState<any>(null);

  // Computed stats
  const totalRsvp = guests.length;
  const checkedIn = guests.filter(g => g.checkIn).length;
  const allocated = guests.filter(g => g.tableId !== null).length;
  const unallocated = totalRsvp - allocated;
  const brideCount = guests.filter(g => g.side === 'Bride').length;
  const groomCount = guests.filter(g => g.side === 'Groom').length;

  const filteredGuests = guests.filter(g => {
    const matchSearch = !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.musicRequest || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSide = filterSide === 'All' || g.side === filterSide;
    return matchSearch && matchSide;
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-stone-100 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <button
            className="lg:hidden p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-wedding-navy flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">L&V</span>
            </div>
            <span className="font-serif text-sm font-semibold text-wedding-navy hidden sm:block">
              Lumiana & Vicente
            </span>
          </div>
          <span className="hidden md:inline text-stone-300 text-xs">|</span>
          <span className="hidden md:inline text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
            Painel Cerimonial
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-700">Sistema activo</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed top-14 bottom-0 left-0 w-56 bg-white border-r border-stone-100 z-30
            flex flex-col transition-transform duration-300
            lg:static lg:translate-x-0 lg:flex
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-wedding-navy text-white font-semibold'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar footer stats */}
            <div className="p-3 border-t border-stone-100">
              <div className="bg-stone-50 rounded-xl p-3 space-y-2">
                <p className="text-[9px] uppercase font-bold text-stone-400 tracking-wider mb-1">Resumo Rápido</p>
                <div className="flex justify-between">
                  <span className="text-[10px] text-stone-500">Convidados</span>
                  <span className="text-[10px] font-bold text-stone-800">{totalRsvp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-stone-500">Check-in feito</span>
                  <span className="text-[10px] font-bold text-green-700">{checkedIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-stone-500">Sem mesa</span>
                  <span className="text-[10px] font-bold text-amber-700">{unallocated}</span>
                </div>
              </div>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && (
                <OverviewSection key={activeSection === 'overview' ? 'overview' : undefined}
                  guests={guests} totalRsvp={totalRsvp} checkedIn={checkedIn}
                  allocated={allocated} unallocated={unallocated}
                  brideCount={brideCount} groomCount={groomCount}
                  onAutoAllocate={onAutoAllocate}
                  onOpenExport={() => setShowExportModal(true)}
                  onResetData={onResetData}
                  onNavigate={setActiveSection}
                />
              )}
              {activeSection === 'scanner' && (
                <SectionWrapper key="scanner" title="Check-in QR Code" icon={QrCode} subtitle="Leia o QR Code dos convidados para confirmar a entrada">
                  <QRScannerPanel />
                </SectionWrapper>
              )}
              {activeSection === 'tables' && (
                <TablesSection key="tables"
                  guests={guests} tables={tables} tableNames={tableNames}
                  tableCount={tableCount} onSetTableCount={onSetTableCount}
                  onAssignGuest={onAssignGuest} onSaveTableName={onSaveTableName}
                  onAddGuest={onAddGuest}
                />
              )}
              {activeSection === 'database' && (
                <DatabaseSection key="database"
                  guests={filteredGuests} allGuests={guests} tables={tables}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  filterSide={filterSide} setFilterSide={setFilterSide}
                  onDeleteGuest={onDeleteGuest}
                  onAssignTable={onAssignTableFromGuest}
                  onAddGuest={onAddGuest}
                  onInvite={(g: any) => setInviteGuest(g)}
                  onView={(g: any) => setViewGuest(g)}
                />
              )}
              {activeSection === 'music' && (
                <SectionWrapper key="music" title="Gestão de Playlist" icon={Music} subtitle="Gerencie as músicas para cada momento do evento">
                  <MusicPanel />
                </SectionWrapper>
              )}
              {activeSection === 'gifts' && (
                <SectionWrapper key="gifts" title="Sequência de Oferendas" icon={Gift} subtitle="Defina a ordem de entrega de presentes durante o evento">
                  <GiftSequencePanel guestNames={guests.map(g => g.name)} />
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
        guests={guests}
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
    </div>
  );
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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-5 h-5 text-wedding-gold" />
          <h1 className="font-serif text-2xl font-semibold text-stone-900">{title}</h1>
        </div>
        {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
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
      className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-stone-900 tabular-nums leading-none">{value}</p>
        <p className="text-xs text-stone-500 mt-1 font-medium leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Overview Section ───────────────────────────────────────────────────────────
function OverviewSection({ guests, totalRsvp, checkedIn, allocated, unallocated, brideCount, groomCount,
  onAutoAllocate, onOpenExport, onResetData, onNavigate }: any) {
  const recentGuests = [...guests].sort((a: any, b: any) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-wedding-gold tracking-widest uppercase mb-1">Cerimonial Interno</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">Visão Geral</h1>
          <p className="text-sm text-stone-500 mt-1">Lumiana & Vicente · 29 Agosto 2026</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onAutoAllocate}
            className="px-4 py-2 bg-wedding-gold hover:bg-amber-400 text-stone-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Distribuição Inteligente
          </button>
          <button onClick={onOpenExport}
            className="px-4 py-2 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={onResetData}
            className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} value={totalRsvp} label="Total confirmados" color="bg-blue-50 text-blue-600" />
        <StatCard icon={Check} value={checkedIn} label="Check-in feito" color="bg-emerald-50 text-emerald-600" sub={`${totalRsvp - checkedIn} em falta`} />
        <StatCard icon={Table2} value={allocated} label="Alocados em mesa" color="bg-amber-50 text-amber-600" sub={`${unallocated} sem mesa`} />
        <StatCard icon={Users} value={`${brideCount} · ${groomCount}`} label="Noiva · Noivo" color="bg-rose-50 text-rose-600" />
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: 'scanner', label: 'Scanner QR', icon: QrCode, color: 'text-wedding-navy', bg: 'bg-blue-50' },
            { id: 'tables', label: 'Gerir Mesas', icon: Table2, color: 'text-amber-700', bg: 'bg-amber-50' },
            { id: 'database', label: 'Convidados', icon: Database, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { id: 'music', label: 'Playlist', icon: Music, color: 'text-purple-700', bg: 'bg-purple-50' },
            { id: 'gifts', label: 'Oferendas', icon: Gift, color: 'text-rose-700', bg: 'bg-rose-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id as Section)}
                className="bg-white border border-stone-100 hover:border-stone-200 hover:shadow-sm rounded-2xl p-4 flex items-center gap-3 text-left transition-all group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${item.color}`} />
                </div>
                <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-900">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 ml-auto transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent guests */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-stone-800">Convidados Recentes</h2>
          <button onClick={() => onNavigate('database')}
            className="text-xs text-wedding-navy hover:underline font-semibold">Ver todos →</button>
        </div>
        <div className="divide-y divide-stone-50">
          {recentGuests.length === 0 ? (
            <p className="text-center py-8 text-stone-400 text-sm">Nenhum convidado ainda.</p>
          ) : recentGuests.map((g: any) => (
            <div key={g.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50/60 transition-colors">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                g.side === 'Bride' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {g.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{g.name}</p>
                <p className="text-[10px] text-stone-400">{g.side === 'Bride' ? 'Noiva' : 'Noivo'} · {g.tableId ? `Mesa ${g.tableId}` : 'Sem mesa'}</p>
              </div>
              {g.checkIn && (
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Check-in</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Tables Section ─────────────────────────────────────────────────────────────
function TablesSection({ guests, tables, tableNames, tableCount, onSetTableCount,
  onAssignGuest, onSaveTableName, onAddGuest }: any) {
  const unallocated = guests.filter((g: any) => g.tableId === null);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Table2 className="w-5 h-5 text-wedding-gold" />
            <h1 className="font-serif text-2xl font-semibold text-stone-900">Disposição de Mesas</h1>
          </div>
          <p className="text-sm text-stone-500">Aloque os convidados e nomeie cada mesa.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-500">Mesas:</label>
          <input type="number" min={2} max={20} value={tableCount}
            onChange={e => { const v = parseInt(e.target.value, 10); if (v >= 2 && v <= 20) onSetTableCount(v); }}
            className="w-14 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-wedding-navy"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tables.map((table: any) => {
            const tGuests = guests.filter((g: any) => g.tableId === table.id);
            const full = tGuests.length >= 6;
            return (
              <div key={table.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
                full ? 'border-rose-200' : 'border-stone-100'
              }`}>
                <div className={`px-4 py-3 border-b flex items-center justify-between ${
                  full ? 'bg-rose-50 border-rose-100' : 'bg-stone-50 border-stone-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mesa {table.id}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    full ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'
                  }`}>{tGuests.length}/6</span>
                </div>
                <div className="p-3 space-y-2">
                  <input
                    value={tableNames[table.id] || ''}
                    onChange={e => onSaveTableName({ ...tableNames, [table.id]: e.target.value })}
                    placeholder="Nome da mesa..."
                    className="w-full text-xs bg-stone-50 border border-stone-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-wedding-navy font-serif font-semibold text-stone-700 placeholder:font-sans placeholder:font-normal"
                  />
                  <div className="space-y-1 min-h-[60px]">
                    {tGuests.length === 0 ? (
                      <p className="text-center text-[11px] text-stone-300 italic py-3">Vazia</p>
                    ) : tGuests.map((g: any) => (
                      <button key={g.id} onClick={() => onAssignGuest(g.id, null)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-rose-50 hover:text-rose-700 transition-colors group ${
                          g.side === 'Bride' ? 'bg-rose-50/50 text-stone-700' : 'bg-blue-50/50 text-stone-700'
                        }`} title="Clique para remover">
                        <span className="font-medium truncate">{g.name}</span>
                        <span className="text-[9px] text-stone-400 group-hover:text-rose-500">✕</span>
                      </button>
                    ))}
                  </div>
                  <select disabled={full}
                    onChange={e => { if (e.target.value) { onAssignGuest(e.target.value, table.id); e.target.value = ''; } }}
                    className="w-full text-[11px] bg-stone-50 border border-stone-100 rounded-lg p-1.5 focus:outline-none disabled:opacity-40 text-stone-600">
                    <option value="">+ Adicionar convidado...</option>
                    {guests.filter((g: any) => g.tableId === null).map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.side === 'Bride' ? 'Noiva' : 'Noivo'})</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unallocated sidebar */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Sem Mesa</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Seleccione uma mesa abaixo</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              unallocated.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {unallocated.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {unallocated.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-stone-600">Todos alocados!</p>
              </div>
            ) : unallocated.map((g: any) => (
              <div key={g.id} className={`rounded-xl border-l-2 p-3 bg-white border border-stone-100 ${
                g.side === 'Bride' ? 'border-l-wedding-burgundy' : 'border-l-wedding-navy'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-stone-800 truncate">{g.name}</span>
                  <span className="text-[9px] text-stone-400 uppercase font-semibold">
                    {g.side === 'Bride' ? '♥' : '♦'}
                  </span>
                </div>
                <select onChange={e => { if (e.target.value) onAssignGuest(g.id, parseInt(e.target.value, 10)); }}
                  className="w-full text-[10px] bg-stone-50 border border-stone-100 rounded-lg p-1.5 focus:outline-none">
                  <option value="">Escolher mesa...</option>
                  {tables.map((t: any) => {
                    const cnt = guests.filter((gg: any) => gg.tableId === t.id).length;
                    return (
                      <option key={t.id} value={t.id} disabled={cnt >= 6}>
                        {tableNames[t.id] || `Mesa ${t.id}`} ({cnt}/6) {cnt >= 6 ? '— Cheia' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-stone-100 shrink-0">
            <button onClick={onAddGuest}
              className="w-full py-2.5 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar Convidado
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Database Section ───────────────────────────────────────────────────────────
function DatabaseSection({ guests, allGuests, tables, searchTerm, setSearchTerm,
  filterSide, setFilterSide, onDeleteGuest, onAssignTable, onAddGuest, onInvite, onView }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-wedding-gold" />
            <h1 className="font-serif text-2xl font-semibold text-stone-900">Base de Dados</h1>
          </div>
          <p className="text-sm text-stone-500">{allGuests.length} convidados registados</p>
        </div>
        <button onClick={onAddGuest}
          className="px-4 py-2 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> Novo Convidado
        </button>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou música..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-700"
          />
        </div>
        <div className="flex gap-1 bg-stone-50 border border-stone-100 rounded-xl p-1">
          {(['All', 'Bride', 'Groom'] as const).map(side => (
            <button key={side} onClick={() => setFilterSide(side)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSide === side ? 'bg-wedding-navy text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}>
              {side === 'All' ? 'Todos' : side === 'Bride' ? 'Noiva' : 'Noivo'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Convidado</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Dieta</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Música</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mesa</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Check-in</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400 text-sm">Nenhum resultado encontrado.</td>
                </tr>
              ) : guests.map((g: any) => (
                <tr key={g.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        g.side === 'Bride' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {g.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-800 text-xs">{g.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[9px] text-stone-400 font-medium">{g.side === 'Bride' ? '♥ Noiva' : '♦ Noivo'}</p>
                          {g.phone && (
                            <p className="text-[9px] text-stone-400 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {g.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      g.diet !== 'Nenhuma' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-stone-400'
                    }`}>
                      {g.diet !== 'Nenhuma' ? g.diet : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell max-w-[180px]">
                    {g.musicRequest ? (
                      <span className="text-[11px] text-stone-600 italic truncate block" title={g.musicRequest}>
                        🎵 {g.musicRequest}
                      </span>
                    ) : <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={g.tableId ?? ''}
                      onChange={e => onAssignTable(g.id, e.target.value ? parseInt(e.target.value, 10) : null)}
                      className="text-[10px] bg-stone-50 border border-stone-100 rounded-lg px-2 py-1 focus:outline-none text-stone-700 min-w-[90px]"
                    >
                      <option value="">Sem mesa</option>
                      {tables.map((t: any) => (
                        <option key={t.id} value={t.id}>Mesa {t.id}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {g.checkIn ? (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Feito
                      </span>
                    ) : (
                      <span className="text-stone-300 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => onView(g)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all" title="Visualizar Tudo">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onInvite(g)}
                        className="p-1.5 text-wedding-navy hover:bg-blue-50 rounded-lg transition-all" title="Enviar convite">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteGuest(g.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
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
