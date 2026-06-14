'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Table2, Users, Crown, Plus, Trash2, Check, X, Search, ShieldAlert, Printer } from 'lucide-react';

interface Companion {
  name: string;
  diet: string;
}

interface Guest {
  id: string;
  name: string;
  side: 'Bride' | 'Groom';
  vip: boolean;
  status: string;
  tableId: number | null;
  companions?: Companion[];
}

interface DBTable {
  id: number;
  name: string;
  capacity: number;
  vip: boolean;
}

interface TableVisualPlannerProps {
  guests: Guest[];
  onAssignGuest: (guestId: string, tableId: number | null) => void;
  onRefreshGuests: () => void;
}

export default function TableVisualPlanner({ guests, onAssignGuest, onRefreshGuests }: TableVisualPlannerProps) {
  const [tables, setTables] = useState<DBTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(6);
  const [tableVip, setTableVip] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (res.ok && data.success) {
        setTables(data.tables);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableName.trim(),
          capacity: tableCapacity,
          vip: tableVip,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTables(prev => [...prev, data.table]);
        setTableName('');
        setTableCapacity(6);
        setTableVip(false);
        setShowAddModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Deseja remover esta mesa? Todos os convidados alocados ficarão sem mesa.')) return;

    try {
      const res = await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
      if (res.ok) {
        setTables(prev => prev.filter(t => t.id !== tableId));
        onRefreshGuests(); // Refresh guest list in parent since assignments changed
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVipGuest = async (guest: Guest) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: guest.id,
          vip: !guest.vip,
        }),
      });
      if (res.ok) {
        onRefreshGuests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeatClick = async (guestId: string, tableId: number | null) => {
    await onAssignGuest(guestId, tableId);
    setSelectedGuestId(null);
  };

  const handlePrintPlan = () => {
    const style = document.createElement('style');
    style.id = 'table-plan-print-style';
    style.textContent = `
      @media print {
        body { background: white !important; color: black !important; }
        body > *:not(#print-table-root) { display: none !important; }
        #print-table-root { display: block !important; }
        .print-card { page-break-inside: avoid; border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
      }
    `;
    document.head.appendChild(style);

    const existing = document.getElementById('print-table-root');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'print-table-root';
    root.style.cssText = 'display:none; padding:20px;';
    
    let html = '<h1 style="font-family:serif; text-align:center; margin-bottom:30px;">Plano de Disposição de Mesas - L&V</h1>';
    
    tables.forEach(table => {
      const tGuests = guests.filter(g => g.tableId === table.id && g.status === 'CONFIRMED');
      html += `
        <div class="print-card">
          <h3 style="margin:0 0 10px 0; font-family:serif;">${table.name} ${table.vip ? '👑 VIP' : ''} (${tGuests.length}/${table.capacity} Assentos)</h3>
          <div style="font-size:12px; line-height:1.6;">
            ${tGuests.length === 0 ? '<em style="color:#888;">Nenhum convidado sentado nesta mesa</em>' : tGuests.map((g, idx) => `${idx + 1}. ${g.name} ${g.vip ? '(VIP)' : ''}`).join('<br/>')}
          </div>
        </div>
      `;
    });

    root.innerHTML = html;
    document.body.appendChild(root);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        root.remove();
        style.remove();
      }, 1000);
    }, 150);
  };

  // Only show confirmed guests for seating plan
  const confirmedGuests = guests.filter(g => g.status === 'CONFIRMED');
  const unassignedGuests = confirmedGuests.filter(g => g.tableId === null);
  const filteredUnassigned = unassignedGuests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left" id="visual-table-planner-root">
      {/* Overview stats header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#001B3D]/10 p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Table2 className="w-5 h-5 text-wedding-gold" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-wedding-navy">Organizador de Assentos</h4>
            <p className="text-[10px] text-stone-400">
              {confirmedGuests.length} confirmados • {unassignedGuests.length} sem mesa atribuída
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrintPlan}
            className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" /> Imprimir Plano
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Criar Mesa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SEATING MATRIX (col-span-8) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-stone-400">A carregar mesas...</div>
          ) : tables.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white border rounded-2xl text-stone-400 italic text-xs">
              Nenhuma mesa criada ainda. Clique em "Criar Mesa" para começar!
            </div>
          ) : (
            tables.map(table => {
              const tableGuests = confirmedGuests.filter(g => g.tableId === table.id);
              const isFull = tableGuests.length >= table.capacity;

              return (
                <div 
                  key={table.id}
                  className={`bg-white rounded-3xl border p-5 flex flex-col justify-between shadow-xs transition-all relative ${
                    table.vip ? 'border-amber-200' : 'border-stone-150'
                  } ${isFull ? 'bg-stone-50/20' : ''}`}
                >
                  {/* Table Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      {table.vip && <Crown className="w-4 h-4 text-wedding-gold fill-wedding-gold" />}
                      <h4 className="font-serif text-sm font-semibold text-wedding-navy">{table.name}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFull ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {tableGuests.length}/{table.capacity}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Seat allocation rows */}
                  <div className="space-y-2 mb-4 min-h-[140px]">
                    {tableGuests.length === 0 ? (
                      <p className="text-center py-10 text-stone-300 italic text-xs">Mesa vazia</p>
                    ) : (
                      tableGuests.map(guest => (
                        <div
                          key={guest.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border ${
                            guest.vip 
                              ? 'bg-amber-50/40 border-amber-200 text-stone-800' 
                              : guest.side === 'Bride' 
                                ? 'bg-rose-50/40 border-rose-100 text-stone-700' 
                                : 'bg-blue-50/40 border-blue-100 text-stone-700'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            {guest.vip && <Crown className="w-3 h-3 text-wedding-gold fill-wedding-gold" />}
                            {guest.name}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleVipGuest(guest)}
                              className={`p-1 rounded hover:bg-white/80 transition-colors ${guest.vip ? 'text-wedding-gold' : 'text-stone-300'}`}
                              title={guest.vip ? 'Remover VIP' : 'Tornar VIP'}
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSeatClick(guest.id, null)}
                              className="text-stone-300 hover:text-rose-600 p-1"
                              title="Retirar da mesa"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick seat selector dropdown */}
                  {!isFull && (
                    <div className="border-t border-stone-100 pt-3">
                      {selectedGuestId ? (
                        <button
                          onClick={() => handleSeatClick(selectedGuestId, table.id)}
                          className="w-full py-2 bg-wedding-navy hover:bg-[#800020] text-white rounded-xl text-xs font-semibold transition-colors text-center"
                        >
                          Sentar Convidado Selecionado
                        </button>
                      ) : (
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              handleSeatClick(e.target.value, table.id);
                              e.target.value = '';
                            }
                          }}
                          className="w-full bg-stone-50 border border-stone-150 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-600"
                        >
                          <option value="">+ Sentar convidado...</option>
                          {unassignedGuests.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name} {g.vip ? '👑' : ''} ({g.side === 'Bride' ? 'Noiva' : 'Noivo'})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: UNASSIGNED GUESTS BOARD (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-[#001B3D]/10 rounded-3xl p-5 flex flex-col max-h-[600px] shadow-xs">
          <div className="border-b border-stone-100 pb-3 mb-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-serif text-sm font-semibold text-wedding-navy">Sem Mesa</h3>
              <p className="text-[10px] text-stone-400">Selecione e depois clique numa mesa</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              unassignedGuests.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {unassignedGuests.length}
            </span>
          </div>

          {/* Search filter */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar sem mesa..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-700"
            />
          </div>

          {/* Unassigned List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
            {filteredUnassigned.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold">Tudo Organizado!</p>
                <p className="text-[9px]">Todos os convidados confirmados estão sentados.</p>
              </div>
            ) : (
              filteredUnassigned.map(guest => {
                const isSelected = selectedGuestId === guest.id;
                return (
                  <div
                    key={guest.id}
                    onClick={() => setSelectedGuestId(isSelected ? null : guest.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-wedding-burgundy/10 border-wedding-burgundy shadow-sm'
                        : 'bg-stone-50/50 border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-stone-850 flex items-center gap-1.5">
                        {guest.vip && <Crown className="w-3.5 h-3.5 text-wedding-gold fill-wedding-gold" />}
                        {guest.name}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        guest.side === 'Bride' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                      }`}>{guest.side === 'Bride' ? 'Noiva' : 'Noivo'}</span>
                    </div>
                    <p className="text-[9px] text-stone-400">Clique para selecionar e sentar numa mesa</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Selection indicator info */}
          {selectedGuestId && (
            <div className="mt-4 p-3 bg-wedding-gold/10 border border-wedding-gold/20 rounded-xl text-[10px] text-stone-700 flex items-center gap-2 shrink-0 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-wedding-gold shrink-0" />
              <span>Convidado selecionado. Agora clique no botão <strong>"Sentar"</strong> da mesa desejada.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-stone-100 z-10 text-stone-900"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-base font-semibold text-wedding-navy mb-4">Nova Mesa de Casamento</h3>

              <form onSubmit={handleAddTable} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Nome da Mesa *</span>
                  <input
                    type="text"
                    required
                    value={tableName}
                    onChange={e => setTableName(e.target.value)}
                    placeholder="Ex: Mesa de Honra, Amigos..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Capacidade de Assentos *</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={tableCapacity}
                    onChange={e => setTableCapacity(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy"
                  />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="vip-table"
                    checked={tableVip}
                    onChange={e => setTableVip(e.target.checked)}
                    className="w-4 h-4 rounded text-wedding-navy focus:ring-wedding-navy"
                  />
                  <label htmlFor="vip-table" className="text-xs font-semibold text-stone-600 cursor-pointer">
                    Mesa VIP (Destaque 👑)
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-wedding-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Criar Mesa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
