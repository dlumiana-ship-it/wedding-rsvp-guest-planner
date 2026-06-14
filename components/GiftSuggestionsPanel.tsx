'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Plus, Trash2, X } from 'lucide-react';

interface GiftSuggestion {
  id: string;
  name: string;
  icon: string;
  desc: string | null;
}

export default function GiftSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🎁', desc: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gift-suggestions');
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gift-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(prev => [...prev, data.suggestion]);
        setForm({ name: '', icon: '🎁', desc: '' });
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja remover este presente do Cestão?')) return;
    try {
      const res = await fetch(`/api/gift-suggestions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuggestions(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#001B3D]/10 p-6 md:p-8 shadow-xs mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-wedding-burgundy" />
            <h3 className="font-serif text-xl font-medium text-wedding-navy">Lista de Presentes (Cestão)</h3>
          </div>
          <p className="text-stone-500 text-xs">
            {suggestions.length} itens sugeridos para os convidados.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-1.5 bg-wedding-burgundy hover:bg-[#800020] text-white rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Item
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAdd}
            className="mb-6 bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-base text-wedding-navy font-semibold">Novo Item no Cestão</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Emoji / Ícone</label>
                <input
                  required
                  value={form.icon}
                  onChange={e => setForm(f => ({...f, icon: e.target.value}))}
                  className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Nome do Item *</label>
                <input
                  required
                  placeholder="Ex: Micro-ondas"
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Descrição Opcional</label>
                <input
                  placeholder="Ex: Para facilitar o dia a dia..."
                  value={form.desc}
                  onChange={e => setForm(f => ({...f, desc: e.target.value}))}
                  className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2 bg-wedding-burgundy hover:bg-[#800020] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Salvar Item
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-10 text-stone-400">A carregar itens...</div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400">
          <Gift className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-stone-600">O Cestão está vazio.</p>
          <p className="text-xs mt-1">Adicione os presentes que deseja sugerir aos convidados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map(item => (
            <div key={item.id} className="bg-white border border-stone-150 rounded-2xl p-4 flex gap-3 items-start relative group hover:border-wedding-burgundy/30 transition-colors">
              <div className="text-3xl shrink-0">{item.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-stone-850">{item.name}</h4>
                <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{item.desc || 'Sem descrição'}</p>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all absolute top-2 right-2"
                title="Remover Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
