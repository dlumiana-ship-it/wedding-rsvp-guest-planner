'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Plus, Trash2, Check, ChevronUp, ChevronDown, Edit3, X, Save } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  requestedBy?: string | null;
  category: string;
  position: number;
  isPlayed: boolean;
  duration?: string | null;
  notes?: string | null;
}

const CATEGORIES = [
  { value: 'cerimonia', label: '⛪ Cerimónia', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { value: 'cocktail', label: '🥂 Cocktail', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { value: 'recepcao', label: '🎊 Recepção', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { value: 'jantar', label: '🍽️ Jantar', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { value: 'pista', label: '🕺 Pista de Dança', color: 'bg-rose-50 border-rose-200 text-rose-800' },
];

function getCategoryStyle(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.color || 'bg-stone-50 border-stone-200 text-stone-700';
}
function getCategoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label || cat;
}

export default function MusicPanel() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [form, setForm] = useState({
    title: '', artist: '', requestedBy: '', category: 'recepcao', duration: '', notes: ''
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) return;
    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => [...prev, data.song]);
        setForm({ title: '', artist: '', requestedBy: '', category: 'recepcao', duration: '', notes: '' });
        setShowAddForm(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleEdit = async (song: Song) => {
    try {
      const res = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: song.id, ...song }),
      });
      const data = await res.json();
      if (data.success) {
        setSongs(prev => prev.map(s => s.id === song.id ? data.song : s));
        setEditingId(null);
      }
    } catch (e) { console.error(e); }
  };

  const togglePlayed = async (song: Song) => {
    try {
      const res = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: song.id, isPlayed: !song.isPlayed }),
      });
      const data = await res.json();
      if (data.success) setSongs(prev => prev.map(s => s.id === song.id ? data.song : s));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta música da playlist?')) return;
    try {
      await fetch(`/api/songs?id=${id}`, { method: 'DELETE' });
      setSongs(prev => prev.filter(s => s.id !== id));
    } catch (e) { console.error(e); }
  };

  const movePosition = async (song: Song, direction: 'up' | 'down') => {
    const categorySongs = songs
      .filter(s => s.category === song.category)
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

  const filtered = filterCategory === 'all'
    ? songs
    : songs.filter(s => s.category === filterCategory);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const list = filtered.filter(s => s.category === cat.value).sort((a, b) => a.position - b.position);
    if (list.length > 0) acc[cat.value] = list;
    return acc;
  }, {} as Record<string, Song[]>);

  const playedCount = songs.filter(s => s.isPlayed).length;

  return (
    <div className="bg-white rounded-3xl border border-[#001B3D]/10 p-6 md:p-8 shadow-xs" id="music-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-5 h-5 text-wedding-burgundy" />
            <h3 className="font-serif text-xl font-medium text-wedding-navy">Gestão de Playlist</h3>
          </div>
          <p className="text-stone-500 text-xs">
            {songs.length} músicas · {playedCount} reproduzidas · {songs.length - playedCount} a aguardar
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none text-stone-700"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-1.5 bg-wedding-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Música
          </button>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAdd}
            className="mb-8 bg-stone-50 border border-stone-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2 flex items-center justify-between">
              <h4 className="font-serif text-base text-wedding-navy font-semibold">Nova Música</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Título *</label>
              <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder="Ex: Evidências" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Artista *</label>
              <input required value={form.artist} onChange={e => setForm(f => ({...f, artist: e.target.value}))}
                placeholder="Ex: Chitãozinho & Xororó" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Pedida por</label>
              <input value={form.requestedBy} onChange={e => setForm(f => ({...f, requestedBy: e.target.value}))}
                placeholder="Nome do convidado (opcional)" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none text-stone-800">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Duração</label>
              <input value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))}
                placeholder="Ex: 3:45" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Notas</label>
              <input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                placeholder="Observações para o DJ" className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Cancelar</button>
              <button type="submit"
                className="px-5 py-2 bg-wedding-burgundy hover:bg-[#500312] text-white text-xs font-semibold rounded-lg tracking-wider uppercase flex items-center gap-1.5 transition-colors">
                <Save className="w-3.5 h-3.5" /> Guardar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Song list grouped by category */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">
          <Music className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
          <p className="text-sm">A carregar playlist...</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Music className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nenhuma música na playlist ainda.</p>
          <p className="text-xs mt-1">Clique em "Adicionar Música" para começar.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catSongs]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getCategoryStyle(cat)}`}>
                  {getCategoryLabel(cat)}
                </span>
                <span className="text-[10px] text-stone-400">{catSongs.length} faixa{catSongs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {catSongs.map((song, idx) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={idx + 1}
                    isFirst={idx === 0}
                    isLast={idx === catSongs.length - 1}
                    isEditing={editingId === song.id}
                    onEdit={() => setEditingId(song.id)}
                    onSave={handleEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onTogglePlayed={() => togglePlayed(song)}
                    onDelete={() => handleDelete(song.id)}
                    onMoveUp={() => movePosition(song, 'up')}
                    onMoveDown={() => movePosition(song, 'down')}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SongRow({ song, index, isFirst, isLast, isEditing, onEdit, onSave, onCancelEdit, onTogglePlayed, onDelete, onMoveUp, onMoveDown }: {
  song: Song; index: number; isFirst: boolean; isLast: boolean; isEditing: boolean;
  onEdit: () => void; onSave: (s: Song) => void; onCancelEdit: () => void;
  onTogglePlayed: () => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const [editData, setEditData] = useState({ ...song });

  useEffect(() => { if (isEditing) setEditData({ ...song }); }, [isEditing]);

  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border-2 border-wedding-burgundy/30 rounded-xl p-4 bg-rose-50/30">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input value={editData.title} onChange={e => setEditData(d => ({...d, title: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none col-span-1" placeholder="Título" />
          <input value={editData.artist} onChange={e => setEditData(d => ({...d, artist: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none col-span-1" placeholder="Artista" />
          <input value={editData.requestedBy || ''} onChange={e => setEditData(d => ({...d, requestedBy: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none" placeholder="Pedida por" />
          <input value={editData.duration || ''} onChange={e => setEditData(d => ({...d, duration: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none" placeholder="Duração (ex: 3:45)" />
          <input value={editData.notes || ''} onChange={e => setEditData(d => ({...d, notes: e.target.value}))}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded text-sm focus:outline-none col-span-2" placeholder="Notas para o DJ" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancelEdit} className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(editData)} className="px-4 py-1.5 text-xs bg-wedding-burgundy text-white rounded-lg font-semibold flex items-center gap-1">
            <Save className="w-3 h-3" /> Guardar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      song.isPlayed ? 'bg-green-50/50 border-green-100 opacity-70' : 'bg-white border-stone-100 hover:border-stone-200'
    }`}>
      {/* Position number */}
      <span className="text-[11px] font-mono text-stone-400 w-5 shrink-0 text-center">{index}</span>

      {/* Play/check toggle */}
      <button onClick={onTogglePlayed}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          song.isPlayed ? 'bg-green-600 border-green-600 text-white' : 'border-stone-300 hover:border-green-500'
        }`}>
        {song.isPlayed && <Check className="w-3.5 h-3.5" />}
      </button>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm truncate ${song.isPlayed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
            {song.title}
          </span>
          {song.duration && <span className="text-[10px] text-stone-400 shrink-0">⏱ {song.duration}</span>}
        </div>
        <div className="text-xs text-stone-500 truncate">
          {song.artist}
          {song.requestedBy && <span className="text-wedding-burgundy"> · ♥ {song.requestedBy}</span>}
          {song.notes && <span className="text-stone-400 italic"> · {song.notes}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onMoveUp} disabled={isFirst}
          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition-colors">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={onMoveDown} disabled={isLast}
          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition-colors">
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
