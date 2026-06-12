'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Plus, Trash2, Check, ChevronUp, ChevronDown, Edit3, X, Save, Users } from 'lucide-react';

interface GiftPresenter {
  id: string;
  guestName: string;
  guestId?: string | null;
  position: number;
  hasGiven: boolean;
  note?: string | null;
  group?: string | null;
}

interface GiftSequencePanelProps {
  guestNames?: string[]; // For autocomplete from the guest list
}

export default function GiftSequencePanel({ guestNames = [] }: GiftSequencePanelProps) {
  const [presenters, setPresenters] = useState<GiftPresenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ guestName: '', note: '', group: '' });

  useEffect(() => { fetchPresenters(); }, []);

  const fetchPresenters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      if (data.success) setPresenters(data.presenters.sort((a: GiftPresenter, b: GiftPresenter) => a.position - b.position));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setPresenters(prev => [...prev, data.presenter]);
        setForm({ guestName: '', note: '', group: '' });
        setShowAddForm(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveEdit = async (presenter: GiftPresenter) => {
    try {
      const res = await fetch('/api/gifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presenter),
      });
      const data = await res.json();
      if (data.success) {
        setPresenters(prev => prev.map(p => p.id === presenter.id ? data.presenter : p));
        setEditingId(null);
      }
    } catch (e) { console.error(e); }
  };

  const toggleGiven = async (presenter: GiftPresenter) => {
    try {
      const res = await fetch('/api/gifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: presenter.id, hasGiven: !presenter.hasGiven }),
      });
      const data = await res.json();
      if (data.success) setPresenters(prev => prev.map(p => p.id === presenter.id ? data.presenter : p));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover da sequência de oferendas?')) return;
    try {
      await fetch(`/api/gifts?id=${id}`, { method: 'DELETE' });
      setPresenters(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  };

  const movePosition = async (presenter: GiftPresenter, direction: 'up' | 'down') => {
    const sorted = [...presenters].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(p => p.id === presenter.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    const [newPos, otherPos] = [other.position, presenter.position];

    await Promise.all([
      fetch('/api/gifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: presenter.id, position: newPos }) }),
      fetch('/api/gifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: other.id, position: otherPos }) }),
    ]);

    setPresenters(prev => prev.map(p => {
      if (p.id === presenter.id) return { ...p, position: newPos };
      if (p.id === other.id) return { ...p, position: otherPos };
      return p;
    }).sort((a, b) => a.position - b.position));
  };

  const givenCount = presenters.filter(p => p.hasGiven).length;
  const sorted = [...presenters].sort((a, b) => a.position - b.position);

  // Group by group name if any
  const hasGroups = presenters.some(p => p.group);

  return (
    <div className="bg-white rounded-3xl border border-[#001B3D]/10 p-6 md:p-8 shadow-xs" id="gift-sequence-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-wedding-gold" />
            <h3 className="font-serif text-xl font-medium text-wedding-navy">Sequência de Oferendas</h3>
          </div>
          <p className="text-stone-500 text-xs">
            {presenters.length} convidados · {givenCount} já presentearam · {presenters.length - givenCount} aguardando
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-1.5 bg-wedding-gold hover:bg-amber-500 text-stone-900 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar à Sequência
        </button>
      </div>

      {/* Progress bar */}
      {presenters.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Progresso</span>
            <span className="text-[10px] text-stone-500 font-mono">{givenCount}/{presenters.length}</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${presenters.length > 0 ? (givenCount / presenters.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-wedding-gold to-amber-400 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAdd}
            className="mb-6 bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-serif text-base text-wedding-navy font-semibold">Adicionar à Sequência</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Nome / Família *</label>
                <input
                  required
                  list="guest-names-list"
                  value={form.guestName}
                  onChange={e => setForm(f => ({...f, guestName: e.target.value}))}
                  placeholder="Ex: Família Costa"
                  className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-gold"
                />
                {guestNames.length > 0 && (
                  <datalist id="guest-names-list">
                    {guestNames.map(name => <option key={name} value={name} />)}
                  </datalist>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Grupo / Lado</label>
                <input
                  value={form.group}
                  onChange={e => setForm(f => ({...f, group: e.target.value}))}
                  placeholder="Ex: Família da Noiva"
                  className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-gold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Observação</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({...f, note: e.target.value}))}
                  placeholder="Ex: Trazer foto emoldurada"
                  className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-gold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Cancelar</button>
              <button type="submit"
                className="px-5 py-2 bg-wedding-gold hover:bg-amber-500 text-stone-900 text-xs font-semibold rounded-lg tracking-wider uppercase flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Presenter list */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">
          <Gift className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
          <p className="text-sm">A carregar sequência...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl">
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Sequência de oferendas vazia.</p>
          <p className="text-xs mt-1 text-stone-400">Adicione os convidados na ordem em que apresentarão os presentes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((presenter, idx) => (
            <PresenterRow
              key={presenter.id}
              presenter={presenter}
              index={idx + 1}
              isFirst={idx === 0}
              isLast={idx === sorted.length - 1}
              isEditing={editingId === presenter.id}
              onEdit={() => setEditingId(presenter.id)}
              onSave={handleSaveEdit}
              onCancelEdit={() => setEditingId(null)}
              onToggleGiven={() => toggleGiven(presenter)}
              onDelete={() => handleDelete(presenter.id)}
              onMoveUp={() => movePosition(presenter, 'up')}
              onMoveDown={() => movePosition(presenter, 'down')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PresenterRow({ presenter, index, isFirst, isLast, isEditing, onEdit, onSave, onCancelEdit, onToggleGiven, onDelete, onMoveUp, onMoveDown }: {
  presenter: GiftPresenter; index: number; isFirst: boolean; isLast: boolean; isEditing: boolean;
  onEdit: () => void; onSave: (p: GiftPresenter) => void; onCancelEdit: () => void;
  onToggleGiven: () => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const [editData, setEditData] = useState({ ...presenter });
  useEffect(() => { if (isEditing) setEditData({ ...presenter }); }, [isEditing]);

  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border-2 border-wedding-gold/40 rounded-xl p-4 bg-amber-50/30 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-500">Nome / Família</label>
          <input value={editData.guestName} onChange={e => setEditData(d => ({...d, guestName: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-500">Grupo</label>
          <input value={editData.group || ''} onChange={e => setEditData(d => ({...d, group: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none" placeholder="Ex: Família da Noiva" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-500">Observação</label>
          <input value={editData.note || ''} onChange={e => setEditData(d => ({...d, note: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none" />
        </div>
        <div className="md:col-span-3 flex gap-2 justify-end">
          <button onClick={onCancelEdit} className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(editData)} className="px-4 py-1.5 text-xs bg-wedding-gold text-stone-900 rounded-lg font-semibold flex items-center gap-1">
            <Save className="w-3 h-3" /> Guardar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      presenter.hasGiven ? 'bg-green-50/60 border-green-100' : 'bg-white border-stone-100 hover:border-stone-200'
    }`}>
      {/* Position badge */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
        presenter.hasGiven ? 'bg-green-600 text-white' : 'bg-wedding-gold/20 text-amber-800'
      }`}>
        {presenter.hasGiven ? <Check className="w-3.5 h-3.5" /> : index}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${presenter.hasGiven ? 'line-through text-stone-400' : 'text-stone-900'}`}>
            {presenter.guestName}
          </span>
          {presenter.group && (
            <span className="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium border border-stone-200">
              {presenter.group}
            </span>
          )}
        </div>
        {presenter.note && (
          <p className="text-[11px] text-stone-400 italic mt-0.5">📝 {presenter.note}</p>
        )}
      </div>

      {/* Given toggle button */}
      <button
        onClick={onToggleGiven}
        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all shrink-0 ${
          presenter.hasGiven
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
        }`}
      >
        {presenter.hasGiven ? '✓ Dado' : 'Marcar'}
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button onClick={onEdit} className="p-1 text-stone-400 hover:text-wedding-burgundy transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1 text-stone-400 hover:text-rose-600 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
