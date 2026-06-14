'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Check, X, Plus, Trash2, Download, 
  Volume2, LogOut, CheckSquare, Square, Search, Filter,
  TrendingUp, MessageSquare, AlertCircle, Sparkles, Clock, Save
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
  { value: 'cerimonia', label: '⛪ Cerimónia', color: 'bg-amber-950/40 text-amber-300 border-amber-800/35' },
  { value: 'cocktail', label: '🥂 Cocktail', color: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/35' },
  { value: 'recepcao', label: '🎊 Recepção', color: 'bg-blue-950/40 text-blue-300 border-blue-800/35' },
  { value: 'jantar', label: '🍽️ Jantar', color: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/35' },
  { value: 'pista', label: '🕺 Pista de Dança', color: 'bg-pink-950/40 text-pink-300 border-pink-800/35' },
];

export default function DJDashboard({ onLogout }: { onLogout: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'suggestions' | 'playlist'>('suggestions');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [form, setForm] = useState({
    title: '', artist: '', category: 'pista', duration: '', notes: ''
  });

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.success) {
        setSongs(data.songs);
      }
    } catch (e) {
      console.error('Error loading songs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) return;

    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'APPROVED', // Added directly by DJ
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => [data.song, ...prev]);
        setForm({ title: '', artist: '', category: 'pista', duration: '', notes: '' });
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModeration = async (song: Song, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
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
    if (!confirm('Deseja excluir esta faixa definitivamente?')) return;
    try {
      const res = await fetch(`/api/songs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSongs(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPlaylist = () => {
    const approvedSongs = songs.filter(s => s.status === 'APPROVED');
    const text = approvedSongs.map((s, i) => `${i + 1}. ${s.title} - ${s.artist} [${s.category.toUpperCase()}]${s.isPlayed ? ' (TOCADA)' : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist_casamento_lumiana_vicente.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group suggestions to show popularity
  const getSuggestionsPopularity = () => {
    const requests = songs.filter(s => s.status === 'PENDING' && s.requestedBy);
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

    return Object.values(grouped)
      .filter(({ song }) => {
        const matchesSearch = !searchTerm || 
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          song.artist.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => b.count - a.count);
  };

  const approvedSongs = songs.filter(s => s.status === 'APPROVED');
  const pendingCount = songs.filter(s => s.status === 'PENDING').length;
  const playedCount = approvedSongs.filter(s => s.isPlayed).length;

  const filteredApproved = approvedSongs.filter(s => {
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    const matchesSearch = !searchTerm || 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A0812] text-stone-100 flex flex-col font-sans selection:bg-pink-500/25 selection:text-pink-300">
      
      {/* ── TOP HEADER (Dark Premium) ─────────────────────────────────── */}
      <header className="h-20 bg-[#120F22]/90 border-b border-stone-800/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/10">
            <Volume2 className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold bg-gradient-to-r from-pink-300 via-indigo-200 to-stone-100 bg-clip-text text-transparent">
              Lumiana & Vicente
            </h1>
            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest font-mono">
              DJ Cabine • Playlist Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#1A1635]/60 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            <span className="font-mono font-semibold">Cabine Ativa</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 border border-stone-800 hover:border-red-500/35 hover:bg-red-950/20 text-xs text-stone-400 hover:text-red-400 rounded-xl transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Cabine</span>
          </button>
        </div>
      </header>

      {/* ── METRICS BAR ────────────────────────────────────────────────── */}
      <div className="bg-[#120F22]/40 border-b border-stone-900 px-6 py-4 grid grid-cols-3 gap-4 max-w-7xl w-full mx-auto mt-6 rounded-2xl">
        <div className="bg-[#121020] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Total Playlist</span>
          <span className="text-2xl font-bold font-mono text-indigo-400">{approvedSongs.length} <span className="text-xs text-stone-550 font-sans">faixas</span></span>
        </div>
        <div className="bg-[#121020] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Músicas Tocadas</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {playedCount} <span className="text-xs text-stone-550 font-sans">/ {approvedSongs.length} ({approvedSongs.length > 0 ? Math.round((playedCount/approvedSongs.length)*100) : 0}%)</span>
          </span>
        </div>
        <div className="bg-[#121020] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Pedidos Pendentes</span>
          <span className="text-2xl font-bold font-mono text-pink-400">{pendingCount} <span className="text-xs text-stone-550 font-sans">pedidos</span></span>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-850 pb-4 shrink-0">
          <div className="flex bg-[#120F22] p-1 border border-stone-800 rounded-xl w-fit">
            {[
              { id: 'suggestions', label: 'Pedidos dos Convidados', count: pendingCount },
              { id: 'playlist', label: 'Playlist Oficial', count: approvedSongs.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id as any);
                  setSearchTerm('');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-500/5'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  activeSection === tab.id ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por faixa ou artista..."
                className="pl-9 pr-4 py-2 bg-[#120F22] border border-stone-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 text-stone-200 w-64"
              />
            </div>

            {activeSection === 'playlist' && (
              <button
                onClick={handleExportPlaylist}
                className="px-4 py-2 border border-stone-800 hover:bg-stone-900 text-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar TXT
              </button>
            )}

            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Faixa
            </button>
          </div>
        </div>

        {/* Add Song Modal Form */}
        <AnimatePresence>
          {showAddForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#120F22] border border-stone-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative text-left"
              >
                <button
                  onClick={() => setShowAddForm(false)}
                  className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-200 hover:bg-stone-850 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="font-serif text-xl text-stone-100 mb-1">Adicionar Música</h3>
                <p className="text-stone-500 text-xs mb-6">Insira os dados da faixa para a playlist aprovada.</p>

                <form onSubmit={handleAddSong} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Título da Música *</label>
                    <input
                      required
                      value={form.title}
                      onChange={e => setForm(f => ({...f, title: e.target.value}))}
                      placeholder="Ex: Dusk Till Dawn"
                      className="w-full px-3.5 py-2.5 bg-[#0D0B18] border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Artista / Banda *</label>
                    <input
                      required
                      value={form.artist}
                      onChange={e => setForm(f => ({...f, artist: e.target.value}))}
                      placeholder="Ex: Sia"
                      className="w-full px-3.5 py-2.5 bg-[#0D0B18] border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Categoria</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({...f, category: e.target.value}))}
                        className="w-full px-3.5 py-2.5 bg-[#0D0B18] border border-stone-800 rounded-xl text-xs text-stone-300 focus:outline-none cursor-pointer"
                      >
                        <option value="pista">🕺 Pista de Dança</option>
                        <option value="cerimonia">⛪ Cerimónia</option>
                        <option value="cocktail">🥂 Cocktail</option>
                        <option value="jantar">🍽️ Jantar</option>
                        <option value="recepcao">🎊 Recepção</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Duração (Opcional)</label>
                      <input
                        value={form.duration}
                        onChange={e => setForm(f => ({...f, duration: e.target.value}))}
                        placeholder="Ex: 3:52"
                        className="w-full px-3.5 py-2.5 bg-[#0D0B18] border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-850 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-xs text-stone-400 hover:bg-stone-850 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Faixa
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ──────────────── SECTION: SUGGESTIONS MODERATION ──────────────── */}
        {activeSection === 'suggestions' && (
          <div className="flex-1 min-h-0 text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              Moderação de Pedidos Recorrentes
            </h2>

            {loading ? (
              <div className="text-center py-16 text-stone-500">Buscando sugestões...</div>
            ) : getSuggestionsPopularity().length === 0 ? (
              <div className="text-center py-16 bg-[#120F22]/30 border border-dashed border-stone-800 rounded-3xl text-stone-500">
                <Music className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhuma sugestão pendente de moderação.</p>
                <p className="text-xs mt-1">Todos os pedidos dos convidados já foram moderados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSuggestionsPopularity().map(({ song, count, guests: guestList, justifications }) => (
                  <div
                    key={song.id}
                    className="bg-[#120F22]/70 border border-stone-800/80 hover:border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-bold text-sm text-stone-200">{song.title}</h3>
                        <span className="text-xs text-stone-500">de {song.artist}</span>
                        {count > 1 && (
                          <span className="bg-pink-500/15 text-pink-400 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                            🔥 {count} Votos
                          </span>
                        )}
                        <span className="text-[9px] bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/50">
                          {CATEGORIES.find(c => c.value === song.category)?.label || 'Outros'}
                        </span>
                      </div>

                      <div className="space-y-2 text-[11px] text-stone-400 bg-[#0C0A15]/60 p-3 rounded-xl border border-stone-850/60 mt-3">
                        <span className="block font-medium text-indigo-300">
                          👤 Sugerido por: <span className="text-stone-300 font-normal">{guestList.join(', ')}</span>
                        </span>
                        
                        {justifications.filter(Boolean).length > 0 && (
                          <div className="border-t border-stone-800/60 pt-2 mt-2">
                            <span className="font-medium text-stone-300 block mb-1">Mensagens dos Convidados:</span>
                            <ul className="list-disc pl-4 space-y-1 text-stone-400 font-light">
                              {justifications.filter(Boolean).map((j, i) => (
                                <li key={i} className="italic">&ldquo;{j}&rdquo;</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-stone-850/80 pt-4 mt-2">
                      <button
                        onClick={() => handleModeration(song, 'APPROVED')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprovar Faixa
                      </button>
                      <button
                        onClick={() => handleModeration(song, 'REJECTED')}
                        className="px-3.5 py-1.5 bg-[#1B1220] hover:bg-red-950/30 text-stone-400 hover:text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── SECTION: OFFICIAL PLAYLIST ──────────────── */}
        {activeSection === 'playlist' && (
          <div className="flex-1 min-h-0 text-left space-y-6">
            
            {/* Filter Categories and played counters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-[#120F22] border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              
              <div className="text-xs text-stone-500 font-mono">
                Filtradas: <span className="text-stone-300">{filteredApproved.length}</span> faixas
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-stone-500">Carregando playlist...</div>
            ) : filteredApproved.length === 0 ? (
              <div className="text-center py-16 bg-[#120F22]/30 border border-dashed border-stone-800 rounded-3xl text-stone-500">
                <Music className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhuma música aprovada nesta categoria.</p>
                <p className="text-xs mt-1">Aprove músicas na fila de sugestões ou adicione manualmente.</p>
              </div>
            ) : (
              <div className="bg-[#120F22]/40 border border-stone-900 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#120F22]/90 border-b border-stone-800/80 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-5 py-4 w-12 text-center">Nº</th>
                        <th className="px-4 py-4 w-10 text-center">Status</th>
                        <th className="px-4 py-4 text-left">Título / Artista</th>
                        <th className="px-4 py-4 text-left">Categoria</th>
                        <th className="px-4 py-4 text-center w-24">Duração</th>
                        <th className="px-4 py-4 text-right pr-6 w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredApproved.map((song, idx) => (
                        <tr
                          key={song.id}
                          className={`hover:bg-[#1A1630]/30 transition-colors ${
                            song.isPlayed ? 'opacity-40 bg-[#0C0A14]/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5 text-center font-mono text-stone-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => togglePlayed(song)}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center mx-auto transition-colors ${
                                song.isPlayed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-stone-800 hover:border-emerald-600'
                              }`}
                              title={song.isPlayed ? 'Marcar como não tocada' : 'Marcar como tocada'}
                            >
                              {song.isPlayed && <Check className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-left">
                            <div className="flex flex-col">
                              <span className={`font-semibold text-xs text-stone-200 ${song.isPlayed ? 'line-through text-stone-500' : ''}`}>
                                {song.title}
                              </span>
                              <span className="text-[10px] text-stone-500 mt-0.5">
                                de {song.artist}
                                {song.requestedBy && (
                                  <span className="text-pink-500/90 font-medium"> • Pedido de: {song.requestedBy}</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-left">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              CATEGORIES.find(c => c.value === song.category)?.color || 'bg-stone-900 border-stone-850 text-stone-400'
                            }`}>
                              {CATEGORIES.find(c => c.value === song.category)?.label || 'Outros'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-stone-400">
                            {song.duration ? `⏱ ${song.duration}` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right pr-6">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleModeration(song, 'PENDING')}
                                className="p-1.5 text-stone-500 hover:text-pink-400 hover:bg-stone-900 rounded-lg transition-colors"
                                title="Mudar para fila de moderação"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(song.id)}
                                className="p-1.5 text-stone-500 hover:text-red-500 hover:bg-stone-900 rounded-lg transition-colors"
                                title="Excluir da playlist"
                              >
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
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#06050B] text-stone-600 py-6 border-t border-stone-900 text-center shrink-0">
        <p className="text-[10px] uppercase tracking-wider font-mono">
          Lumiana & Vicente • Cabine de Som Segura • © 2026
        </p>
      </footer>
    </div>
  );
}
