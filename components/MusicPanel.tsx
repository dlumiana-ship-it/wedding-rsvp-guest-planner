'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Plus, Trash2, Check, ChevronUp, ChevronDown, 
  Edit3, X, Save, Sparkles, Download, Volume2, User, HelpCircle, Calendar 
} from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  requestedBy?: string | null;
  justification?: string | null;
  category: string;
  position: number;
  isPlayed: boolean;
  status: string; // PENDING, APPROVED, REJECTED
  duration?: string | null;
  notes?: string | null;
}

const CATEGORIES = [
  { value: 'cerimonia', label: '⛪ Cerimónia', color: 'bg-amber-50 border-amber-250 text-amber-800' },
  { value: 'cocktail', label: '🥂 Cocktail', color: 'bg-purple-50 border-purple-250 text-purple-800' },
  { value: 'recepcao', label: '🎊 Recepção', color: 'bg-blue-50 border-blue-250 text-blue-800' },
  { value: 'jantar', label: '🍽️ Jantar', color: 'bg-emerald-50 border-emerald-250 text-emerald-800' },
  { value: 'pista', label: '🕺 Pista de Dança', color: 'bg-rose-50 border-rose-250 text-rose-800' },
];

const MC_MOMENTS_INITIAL = [
  { id: 'm-1', label: 'Entrada dos Noivos', songId: '', notes: 'Garantir volume alto e energia positiva' },
  { id: 'm-2', label: 'Primeira Dança', songId: '', notes: 'Fumos e luz quente ativados' },
  { id: 'm-3', label: 'Corte do Bolo', songId: '', notes: 'Espumantes servidos a todos' },
  { id: 'm-4', label: 'Lançamento do Bouquet', songId: '', notes: 'Chamar todas as solteiras à pista' },
  { id: 'm-5', label: 'Encerramento', songId: '', notes: 'Agradecimento oficial dos noivos' },
];

export default function MusicPanel() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'playlist' | 'suggestions' | 'mc'>('playlist');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // MC Moments state saved locally
  const [mcMoments, setMcMoments] = useState<typeof MC_MOMENTS_INITIAL>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_mc_moments');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return MC_MOMENTS_INITIAL;
  });

  // Form state
  const [form, setForm] = useState({
    title: '', artist: '', requestedBy: '', justification: '', category: 'recepcao', duration: '', notes: ''
  });

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.success) setSongs(data.songs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) return;

    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'APPROVED', // Manually added by DJ is approved by default
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => [...prev, data.song]);
        setForm({ title: '', artist: '', requestedBy: '', justification: '', category: 'recepcao', duration: '', notes: '' });
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async (song: Song) => {
    try {
      const res = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => prev.map(s => s.id === song.id ? data.song : s));
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModeration = async (song: Song, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: song.id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => prev.map(s => s.id === song.id ? data.song : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlayed = async (song: Song) => {
    try {
      const res = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: song.id, isPlayed: !song.isPlayed }),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => prev.map(s => s.id === song.id ? data.song : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta música permanentemente?')) return;
    try {
      await fetch(`/api/songs?id=${id}`, { method: 'DELETE' });
      setSongs(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const movePosition = async (song: Song, direction: 'up' | 'down') => {
    const categorySongs = songs
      .filter(s => s.category === song.category && s.status === 'APPROVED')
      .sort((a, b) => a.position - b.position);
    const idx = categorySongs.findIndex(s => s.id === song.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categorySongs.length) return;

    const other = categorySongs[swapIdx];
    const [newPos, otherPos] = [other.position, song.position];

    await Promise.all([
      fetch('/api/songs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: song.id, position: newPos }) }),
      fetch('/api/songs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: other.id, position: otherPos }) }),
    ]);

    setSongs(prev => prev.map(s => {
      if (s.id === song.id) return { ...s, position: newPos };
      if (s.id === other.id) return { ...s, position: otherPos };
      return s;
    }));
  };

  const handleUpdateMcMoment = (momentId: string, songId: string, notes: string) => {
    const updated = mcMoments.map(m => m.id === momentId ? { ...m, songId, notes } : m);
    setMcMoments(updated);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
  };

  const handleExportPlaylist = () => {
    const approvedSongs = songs.filter(s => s.status === 'APPROVED');
    const text = approvedSongs.map((s, i) => `${i + 1}. ${s.title} - ${s.artist} [${s.category.toUpperCase()}]`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist_oficial_casamento.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group song suggestions to identify duplicate suggestions / popularity
  const getSuggestionsPopularity = () => {
    const requests = songs.filter(s => s.requestedBy);
    const grouped: Record<string, { song: Song; count: number; guests: string[]; justifications: string[] }> = {};

    requests.forEach(s => {
      const key = `${s.title.toLowerCase().trim()}::${s.artist.toLowerCase().trim()}`;
      if (grouped[key]) {
        grouped[key].count += 1;
        if (s.requestedBy) grouped[key].guests.push(s.requestedBy);
        if (s.justification) grouped[key].justifications.push(s.justification);
      } else {
        grouped[key] = {
          song: s,
          count: 1,
          guests: s.requestedBy ? [s.requestedBy] : [],
          justifications: s.justification ? [s.justification] : [],
        };
      }
    });

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  };

  const approvedSongs = songs.filter(s => s.status === 'APPROVED');
  const suggestions = songs.filter(s => s.status === 'PENDING');
  const rejectedSongs = songs.filter(s => s.status === 'REJECTED');

  const filteredApproved = filterCategory === 'all'
    ? approvedSongs
    : approvedSongs.filter(s => s.category === filterCategory);

  const groupedPlaylist = CATEGORIES.reduce((acc, cat) => {
    const list = filteredApproved.filter(s => s.category === cat.value).sort((a, b) => a.position - b.position);
    if (list.length > 0) acc[cat.value] = list;
    return acc;
  }, {} as Record<string, Song[]>);

  return (
    <div className="bg-white rounded-3xl border border-[#001B3D]/10 p-6 md:p-8 shadow-xs text-stone-900" id="music-management-panel">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-5 h-5 text-wedding-burgundy" />
            <h3 className="font-serif text-xl text-wedding-navy">Playlist do Evento</h3>
          </div>
          <p className="text-stone-500 text-xs">
            {approvedSongs.length} aprovadas • {suggestions.length} sugestões pendentes
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPlaylist}
            className="px-3.5 py-1.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-white"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Playlist
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-1.5 bg-wedding-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Faixa
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 mb-6 gap-6">
        {[
          { id: 'playlist', label: 'Playlist Oficial', badge: approvedSongs.length },
          { id: 'suggestions', label: 'Sugestões dos Convidados', badge: suggestions.length },
          { id: 'mc', label: 'Cronograma MC', badge: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-wedding-burgundy text-wedding-burgundy'
                : 'border-transparent text-stone-500 hover:text-stone-850'
            }`}
          >
            {tab.label}
            {tab.badge !== null && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-sans font-semibold ${
                activeTab === tab.id ? 'bg-wedding-burgundy/10 text-wedding-burgundy' : 'bg-stone-100 text-stone-500'
              }`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Forms & Content views */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAdd}
            className="mb-8 bg-stone-50 border border-stone-200/60 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
          >
            <div className="md:col-span-2 flex items-center justify-between">
              <h4 className="font-serif text-sm font-semibold text-wedding-navy">Adicionar Faixa Manual</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Música *</label>
              <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder="Ex: Evidências" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Artista *</label>
              <input required value={form.artist} onChange={e => setForm(f => ({...f, artist: e.target.value}))}
                placeholder="Ex: Chitãozinho & Xororó" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none text-stone-700">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Duração</label>
              <input value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))}
                placeholder="Ex: 3:40" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-5 py-1.5 bg-wedding-navy text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Guardar</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ──────────────── TAB: OFFICIAL PLAYLIST ──────────────── */}
      {activeTab === 'playlist' && (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none text-stone-750"
            >
              <option value="all">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-stone-400">A carregar...</div>
          ) : approvedSongs.length === 0 ? (
            <div className="text-center py-12 text-stone-400 italic text-xs">Nenhuma música aprovada. Vá a sugestões para moderar.</div>
          ) : (
            <div className="space-y-6 text-left">
              {Object.entries(groupedPlaylist).map(([cat, catSongs]) => (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      CATEGORIES.find(c => c.value === cat)?.color || ''
                    }`}>{CATEGORIES.find(c => c.value === cat)?.label}</span>
                    <span className="text-[10px] text-stone-400">{catSongs.length} faixas</span>
                  </div>
                  
                  {catSongs.map((song, idx) => (
                    <div
                      key={song.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        song.isPlayed ? 'bg-green-50/50 border-green-100 opacity-65' : 'bg-white border-stone-100 hover:border-stone-200'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-stone-400 w-5 shrink-0 text-center">{idx + 1}</span>
                      
                      <button
                        onClick={() => togglePlayed(song)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          song.isPlayed ? 'bg-green-600 border-green-600 text-white' : 'border-stone-300 hover:border-green-600'
                        }`}
                      >
                        {song.isPlayed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-xs truncate ${song.isPlayed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                            {song.title}
                          </span>
                          {song.duration && <span className="text-[9px] text-stone-400 shrink-0">⏱ {song.duration}</span>}
                        </div>
                        <p className="text-[10px] text-stone-500 truncate">
                          {song.artist}
                          {song.requestedBy && <span className="text-[#800020] font-medium"> • ♥ {song.requestedBy}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePosition(song, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => movePosition(song, 'down')}
                          disabled={idx === catSongs.length - 1}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModeration(song, 'REJECTED')}
                          className="p-1.5 text-stone-400 hover:text-rose-600"
                          title="Arquivar/Rejeitar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(song.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB: GUEST SUGGESTIONS ──────────────── */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6 text-left">
          {loading ? (
            <div className="text-center py-12 text-stone-400">A carregar...</div>
          ) : getSuggestionsPopularity().length === 0 ? (
            <div className="text-center py-12 text-stone-400 italic text-xs">Sem sugestões de convidados pendentes de moderação.</div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] text-stone-550 mb-4 border-b pb-2">Esta lista agrupa sugestões duplicadas para evidenciar as músicas mais populares:</p>
              
              {getSuggestionsPopularity().map(({ song, count, guests: requesterList, justifications }) => (
                <div
                  key={song.id}
                  className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-stone-250 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-stone-850">{song.title}</h4>
                      <span className="text-[10px] text-stone-400">— {song.artist}</span>
                      {count > 1 && (
                        <span className="bg-[#800020]/10 text-[#800020] text-[9px] font-bold px-2 py-0.5 rounded-full">
                          🔥 {count} Pedidos
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 text-[10px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#C5A880]" />
                        <strong>Sugerida por:</strong> {requesterList.join(', ')}
                      </span>
                      
                      {justifications.filter(Boolean).length > 0 && (
                        <span className="flex items-start gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-[#C5A880] mt-0.5" />
                          <span>
                            <strong>Justificativas:</strong>
                            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-stone-600">
                              {justifications.map((just, idx) => (
                                <li key={idx} className="italic">&ldquo;{just}&rdquo;</li>
                              ))}
                            </ul>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleModeration(song, 'APPROVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleModeration(song, 'REJECTED')}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-rose-50 hover:text-rose-700 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB: MC TIMELINE ──────────────── */}
      {activeTab === 'mc' && (
        <div className="space-y-6 text-left">
          <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-2.5 mb-4">
            <Volume2 className="w-5 h-5 text-wedding-gold animate-bounce shrink-0" />
            <p className="text-xs text-stone-650 leading-relaxed font-light">
              Módulo exclusivo para o <strong>Mestre de Cerimónias (MC)</strong> organizar a sequência musical dos momentos principais do evento. As músicas podem ser escolhidas diretamente da playlist aprovada.
            </p>
          </div>

          <div className="space-y-4">
            {mcMoments.map(moment => (
              <div key={moment.id} className="bg-white border border-stone-150 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-stretch">
                {/* Time Indicator */}
                <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-stone-100 pb-3 md:pb-0 md:pr-4 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-wedding-burgundy mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Momento MC</span>
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-wedding-navy">{moment.label}</h4>
                </div>

                {/* Song selector */}
                <div className="flex-1 flex flex-col gap-3 justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-stone-400">Música Associada</span>
                      <select
                        value={moment.songId}
                        onChange={e => handleUpdateMcMoment(moment.id, e.target.value, moment.notes)}
                        className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                      >
                        <option value="">— Sem música selecionada —</option>
                        {approvedSongs.map(s => (
                          <option key={s.id} value={s.id}>{s.title} (de {s.artist})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-stone-400">Notas para o Protocolo</span>
                      <input
                        type="text"
                        value={moment.notes}
                        onChange={e => handleUpdateMcMoment(moment.id, moment.songId, e.target.value)}
                        placeholder="Notas sobre discursos, iluminação..."
                        className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                      />
                    </div>
                  </div>

                  {moment.songId && (
                    <div className="bg-[#C5A880]/5 rounded-lg px-3 py-2 text-[10px] text-stone-600 flex items-center gap-2 border border-[#C5A880]/15">
                      <Sparkles className="w-3.5 h-3.5 text-wedding-gold shrink-0" />
                      <span>
                        <strong>Música Ativa:</strong> {
                          approvedSongs.find(s => s.id === moment.songId)?.title
                        } (de {approvedSongs.find(s => s.id === moment.songId)?.artist})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
