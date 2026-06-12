'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, FileText, Users, Heart, Crown,
  Table2, FileSpreadsheet, CheckCircle2, Sparkles
} from 'lucide-react';
import { generateWeddingPDF, generateCSV, type ExportScope, type Guest, type Table } from '../lib/exportPDF';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  tables: Table[];
  tableNames: Record<number, string>;
}

type Format = 'pdf' | 'csv';

export default function ExportModal({ isOpen, onClose, guests, tables, tableNames }: ExportModalProps) {
  const [selectedScope, setSelectedScope] = useState<ExportScope>({ type: 'all' });
  const [format, setFormat] = useState<Format>('pdf');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const filledTables = tables.filter(t => guests.some(g => g.tableId === t.id));

  const counts = {
    all: guests.length,
    bride: guests.filter(g => g.side === 'Bride').length,
    groom: guests.filter(g => g.side === 'Groom').length,
    byTable: (id: number) => guests.filter(g => g.tableId === id).length,
  };

  const isSel = (scope: ExportScope): boolean => {
    if (scope.type !== selectedScope.type) return false;
    if (scope.type === 'side' && selectedScope.type === 'side') return scope.side === selectedScope.side;
    if (scope.type === 'table' && selectedScope.type === 'table') return scope.tableId === selectedScope.tableId;
    return true;
  };

  const previewText = (): string => {
    if (selectedScope.type === 'all') return `${counts.all} convidados — lista completa, mesas e restrições`;
    if (selectedScope.type === 'side') {
      const n = selectedScope.side === 'Bride' ? counts.bride : counts.groom;
      return `${n} convidados — ${selectedScope.side === 'Bride' ? 'Família da Noiva' : 'Família do Noivo'}`;
    }
    const n = counts.byTable(selectedScope.tableId);
    const name = tableNames[selectedScope.tableId];
    return `${n} convidado${n !== 1 ? 's' : ''} — ${name ? `Mesa ${selectedScope.tableId} · ${name}` : `Mesa ${selectedScope.tableId}`}`;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === 'pdf') generateWeddingPDF(guests, tables, tableNames, selectedScope);
      else generateCSV(guests, selectedScope, tableNames);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 top-4 bottom-4 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[88vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-wedding-navy rounded-lg flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Exportação Inteligente</h2>
                  <p className="text-[10px] text-stone-400 leading-none mt-0.5">Escolha o formato e o que exportar</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">

                {/* ── Formato ── */}
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2.5">Formato</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { id: 'pdf' as Format, label: 'PDF Profissional', sub: 'Para imprimir', icon: FileText, accent: '#dc2626', bg: '#fef2f2' },
                      { id: 'csv' as Format, label: 'Excel / CSV', sub: 'Para editar', icon: FileSpreadsheet, accent: '#16a34a', bg: '#f0fdf4' },
                    ]).map(opt => {
                      const active = format === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setFormat(opt.id)}
                          className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                            active ? 'border-wedding-navy bg-slate-50 shadow-sm' : 'border-stone-100 hover:border-stone-200 bg-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: opt.bg }}>
                            <opt.icon className="w-4.5 h-4.5" style={{ color: opt.accent }} />
                          </div>
                          <div>
                            <p className={`text-[11px] font-bold leading-tight ${active ? 'text-wedding-navy' : 'text-stone-700'}`}>{opt.label}</p>
                            <p className="text-[9px] text-stone-400 mt-0.5">{opt.sub}</p>
                          </div>
                          {active && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 rounded-full bg-wedding-navy" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Escopo ── */}
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2.5">O que exportar</p>
                  <div className="space-y-2">

                    {/* Todos os convidados */}
                    <ScopeRow
                      icon={Users} iconColor="#2563eb" iconBg="#eff6ff"
                      label="Todos os Convidados" count={counts.all}
                      sub="Lista completa + plano de mesas + restrições"
                      selected={isSel({ type: 'all' })}
                      onClick={() => setSelectedScope({ type: 'all' })}
                    />

                    {/* Família Noiva */}
                    <ScopeRow
                      icon={Heart} iconColor="#be123c" iconBg="#fff1f2"
                      label="Família da Noiva" count={counts.bride}
                      sub="Apenas o lado da Noiva"
                      selected={isSel({ type: 'side', side: 'Bride' })}
                      onClick={() => setSelectedScope({ type: 'side', side: 'Bride' })}
                    />

                    {/* Família Noivo */}
                    <ScopeRow
                      icon={Crown} iconColor="#4338ca" iconBg="#eef2ff"
                      label="Família do Noivo" count={counts.groom}
                      sub="Apenas o lado do Noivo"
                      selected={isSel({ type: 'side', side: 'Groom' })}
                      onClick={() => setSelectedScope({ type: 'side', side: 'Groom' })}
                    />

                    {/* Por mesa */}
                    {filledTables.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mt-4 mb-2">
                          <Table2 className="w-3 h-3 text-stone-400" />
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Por Mesa</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {filledTables.map(table => {
                            const cnt = counts.byTable(table.id);
                            const name = tableNames[table.id];
                            const sel = isSel({ type: 'table', tableId: table.id });
                            return (
                              <button
                                key={table.id}
                                onClick={() => setSelectedScope({ type: 'table', tableId: table.id })}
                                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-150 ${
                                  sel ? 'border-wedding-navy bg-slate-50 shadow-sm' : 'border-stone-100 hover:border-stone-200 bg-white'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${
                                  sel ? 'bg-wedding-navy text-white' : 'bg-stone-100 text-stone-600'
                                }`}>
                                  {table.id}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[11px] font-semibold truncate ${sel ? 'text-wedding-navy' : 'text-stone-700'}`}>
                                    {name || `Mesa ${table.id}`}
                                  </p>
                                  <p className="text-[9px] text-stone-400">{cnt} convidado{cnt !== 1 ? 's' : ''}</p>
                                </div>
                                {sel && <div className="w-2 h-2 rounded-full bg-wedding-navy shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer fixo ── */}
            <div className="px-5 pb-5 pt-3 border-t border-stone-50 shrink-0 space-y-3">
              {/* Preview */}
              <div className="flex items-center gap-2.5 bg-stone-50 rounded-xl px-3.5 py-2.5 border border-stone-100">
                <Sparkles className="w-3.5 h-3.5 text-wedding-gold shrink-0" />
                <p className="text-[11px] text-stone-600 leading-snug">
                  <span className="font-bold text-stone-800">{format === 'pdf' ? 'PDF' : 'CSV'}:</span>
                  {' '}{previewText()}
                </p>
              </div>

              {/* Botão exportar */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-wedding-navy hover:bg-slate-800 active:scale-[0.98] text-white disabled:opacity-60'
                }`}
              >
                {done ? (
                  <><CheckCircle2 className="w-4.5 h-4.5" /> {format === 'pdf' ? 'Diálogo de impressão aberto!' : 'Ficheiro descarregado!'}</>
                ) : exporting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A preparar…</>
                ) : (
                  <><Download className="w-4.5 h-4.5" /> Exportar {format === 'pdf' ? 'PDF' : 'CSV'}</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── ScopeRow ─────────────────────────────────────────────────────────────────
function ScopeRow({ icon: Icon, iconColor, iconBg, label, count, sub, selected, onClick }: {
  icon: React.FC<any>; iconColor: string; iconBg: string;
  label: string; count: number; sub: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 ${
        selected ? 'border-wedding-navy bg-slate-50 shadow-sm' : 'border-stone-100 hover:border-stone-200 bg-white'
      }`}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold ${selected ? 'text-wedding-navy' : 'text-stone-700'}`}>{label}</p>
        <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>
      </div>
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
        selected ? 'bg-wedding-navy text-white' : 'bg-stone-100 text-stone-500'
      }`}>
        {count}
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        selected ? 'border-wedding-navy bg-wedding-navy' : 'border-stone-200'
      }`}>
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}
