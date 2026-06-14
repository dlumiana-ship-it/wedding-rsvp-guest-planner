'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Star, Image as ImageIcon, Upload, Check, 
  MapPin, LogOut, Search, X, Sparkles, Plus, Trash2, ListChecks
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  vip: boolean;
  tableId: number | null;
  status: string;
}

interface Table {
  id: number;
  name: string;
}

interface ShotItem {
  id: string;
  category: string;
  title: string;
  done: boolean;
}

const DEFAULT_SHOTS: ShotItem[] = [
  { id: 's1', category: 'Making Of', title: 'Vestido de Noiva pendurado', done: false },
  { id: 's2', category: 'Making Of', title: 'Detalhe das Alianças', done: false },
  { id: 's3', category: 'Making Of', title: 'Noivo com os Padrinhos', done: false },
  { id: 's4', category: 'Cerimónia', title: 'A entrada da Noiva', done: false },
  { id: 's5', category: 'Cerimónia', title: 'Primeiro olhar do Noivo', done: false },
  { id: 's6', category: 'Cerimónia', title: 'O Beijo', done: false },
  { id: 's7', category: 'Retratos', title: 'Noivos com Pais da Noiva', done: false },
  { id: 's8', category: 'Retratos', title: 'Noivos com Pais do Noivo', done: false },
  { id: 's9', category: 'Copo de Água', title: 'A Primeira Dança', done: false },
  { id: 's10', category: 'Copo de Água', title: 'Corte do Bolo', done: false },
];

export default function PhotographerDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'shots' | 'vip' | 'live'>('shots');
  
  // VIP Radar State
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);

  // Shot List State
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [newShot, setNewShot] = useState({ title: '', category: 'Retratos' });
  const [showAddShot, setShowAddShot] = useState(false);

  // Live Gallery State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGuests();
    fetchTables();
    
    // Load Shots
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_photo_shots');
      if (saved) {
        try {
          setShots(JSON.parse(saved));
        } catch (e) {
          setShots(DEFAULT_SHOTS);
        }
      } else {
        setShots(DEFAULT_SHOTS);
      }
    }
  }, []);

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/guests');
      const data = await res.json();
      if (res.ok) {
        setGuests(data.guests.filter((g: Guest) => g.vip && g.status === 'CONFIRMED'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGuests(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (res.ok) setTables(data.tables);
    } catch (e) {
      console.error(e);
    }
  };

  // Shot List Actions
  const toggleShot = (id: string) => {
    const updated = shots.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setShots(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_photo_shots', JSON.stringify(updated));
    }
  };

  const handleAddShot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShot.title.trim()) return;
    const shot: ShotItem = {
      id: 'sh-' + Math.random().toString(36).substring(2, 9),
      category: newShot.category,
      title: newShot.title.trim(),
      done: false
    };
    const updated = [...shots, shot];
    setShots(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_photo_shots', JSON.stringify(updated));
    }
    setNewShot({ title: '', category: 'Retratos' });
    setShowAddShot(false);
  };

  const deleteShot = (id: string) => {
    const updated = shots.filter(s => s.id !== id);
    setShots(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_photo_shots', JSON.stringify(updated));
    }
  };

  // Group shots by category
  const shotsByCategory = shots.reduce((acc, shot) => {
    if (!acc[shot.category]) acc[shot.category] = [];
    acc[shot.category].push(shot);
    return acc;
  }, {} as Record<string, ShotItem[]>);

  // Live Gallery Upload Actions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida.');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setError('Imagem excede 2.5MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
        setUploadedBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadedBase64) return;
    setUploading(true);
    setError('');

    try {
      // 1. Upload photo
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadedBase64,
          uploadedBy: 'Equipa de Fotografia',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.photo) {
        // 2. Instantly approve the photo so it goes live to the Digital Wall
        await fetch('/api/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.photo.id,
            approved: true,
          }),
        });

        setUploadSuccess(true);
        setUploadedBase64(null);
        setPreviewUrl(null);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setError(data.error || 'Erro ao enviar foto.');
      }
    } catch (e) {
      setError('Erro de conexão ao enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-stone-200 flex flex-col font-sans selection:bg-[#C5A880]/20 selection:text-[#C5A880]">
      {/* HEADER */}
      <header className="h-16 bg-[#000] border-b border-stone-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div>
            <h1 className="font-serif text-sm font-semibold text-white">L & V • Fotografia</h1>
            <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest">Live Studio Dashboard</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-rose-950/30 border border-stone-800 hover:border-rose-900/50 text-stone-400 hover:text-rose-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* METRICS */}
      <div className="bg-[#0a0a0a] border-b border-stone-900 px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#1a1a1a] p-3 rounded-xl border border-stone-800 text-center">
          <span className="text-[10px] text-stone-500 uppercase font-bold">Total VIPs</span>
          <div className="text-xl font-bold font-mono text-amber-500 mt-1">{guests.length}</div>
        </div>
        <div className="bg-[#1a1a1a] p-3 rounded-xl border border-stone-800 text-center">
          <span className="text-[10px] text-stone-500 uppercase font-bold">Shots Concluídos</span>
          <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
            {shots.filter(s => s.done).length} <span className="text-xs text-stone-600">/ {shots.length}</span>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* TABS */}
        <div className="flex border-b border-stone-800 pb-3 gap-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'shots', label: 'Shot List', icon: ListChecks },
            { id: 'vip', label: 'Radar VIPs', icon: Star },
            { id: 'live', label: 'Live Sneak Peeks', icon: Upload },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#C5A880] text-[#C5A880]'
                    : 'border-transparent text-stone-500 hover:text-stone-300'
                }`}
              >
                <Icon className="w-4 h-4" /> <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SHOT LIST */}
        {activeTab === 'shots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-400">Marque as fotografias obrigatórias concluídas.</p>
              <button 
                onClick={() => setShowAddShot(true)}
                className="text-[10px] font-bold uppercase bg-[#1a1a1a] border border-stone-800 hover:bg-stone-800 px-3 py-1.5 rounded-lg text-[#C5A880] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>

            <AnimatePresence>
              {showAddShot && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddShot}
                  className="bg-[#1a1a1a] p-4 rounded-2xl border border-stone-800 flex flex-col gap-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      required 
                      placeholder="Descrição da Foto (Ex: Avós da Noiva)"
                      value={newShot.title}
                      onChange={e => setNewShot({ ...newShot, title: e.target.value })}
                      className="bg-[#000] border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                    <select
                      value={newShot.category}
                      onChange={e => setNewShot({ ...newShot, category: e.target.value })}
                      className="bg-[#000] border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Making Of">Making Of</option>
                      <option value="Cerimónia">Cerimónia</option>
                      <option value="Retratos">Retratos</option>
                      <option value="Copo de Água">Copo de Água</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button type="button" onClick={() => setShowAddShot(false)} className="text-xs text-stone-500 px-3 py-1 hover:text-white cursor-pointer">Cancelar</button>
                    <button type="submit" className="text-xs bg-[#C5A880] text-black hover:bg-[#b0926d] font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer">Guardar</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(shotsByCategory).map(([category, items]) => (
                <div key={category} className="bg-[#1a1a1a] rounded-2xl border border-stone-800 overflow-hidden">
                  <div className="bg-[#222] px-4 py-2 border-b border-stone-800">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A880]">{category}</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {items.map(shot => (
                      <div key={shot.id} className="flex items-center justify-between gap-3 group">
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <button onClick={() => toggleShot(shot.id)} className={`shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors cursor-pointer ${shot.done ? 'bg-emerald-950 border-emerald-800' : 'border-stone-600 bg-[#111]'}`}>
                            {shot.done && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                          <span className={`text-sm truncate transition-colors ${shot.done ? 'text-stone-600 line-through' : 'text-stone-300'}`}>
                            {shot.title}
                          </span>
                        </label>
                        <button onClick={() => deleteShot(shot.id)} className="text-stone-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VIP RADAR */}
        {activeTab === 'vip' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-400">Localize rapidamente convidados importantes confirmados para fotografias nas mesas.</p>
            {loadingGuests ? (
              <p className="text-xs text-stone-500 italic">A carregar VIPs...</p>
            ) : guests.length === 0 ? (
              <p className="text-xs text-stone-500 italic">Nenhum convidado VIP confirmado encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {guests.map(guest => {
                  const table = tables.find(t => t.id === guest.tableId);
                  return (
                    <div key={guest.id} className="bg-[#1a1a1a] border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-serif text-base text-white">{guest.name}</h4>
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400 bg-[#000] p-2 rounded-lg border border-stone-800">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">{table ? table.name : 'Sem mesa definida'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE SNEAK PEEKS */}
        {activeTab === 'live' && (
          <div className="space-y-6 max-w-xl mx-auto w-full text-center">
            <div>
              <Sparkles className="w-8 h-8 text-[#C5A880] mx-auto mb-3" />
              <h2 className="font-serif text-xl text-white">Live Sneak Peeks</h2>
              <p className="text-xs text-stone-400 mt-2">
                As fotos enviadas aqui serão instantaneamente pré-aprovadas e publicadas na 
                Galeria Colaborativa para passarem no Telão do salão.
              </p>
            </div>

            {uploadSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/20 border border-emerald-900 rounded-2xl p-8 flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-emerald-400 font-bold mb-1">Foto em direto!</h3>
                <p className="text-xs text-emerald-600/80">O sneak peek foi partilhado com os convidados.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a] border border-stone-800 rounded-2xl p-6"
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-700 bg-black">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90" />
                      <button
                        onClick={() => { setPreviewUrl(null); setUploadedBase64(null); setError(''); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {error && <p className="text-[10px] text-rose-500 bg-rose-950/30 py-1.5 px-3 rounded-lg border border-rose-900/50">{error}</p>}
                    <button
                      onClick={handleUploadSubmit}
                      disabled={uploading}
                      className="w-full py-3 bg-[#C5A880] hover:bg-[#b0926d] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#C5A880]/10"
                    >
                      {uploading ? 'A Enviar...' : 'Publicar ao Vivo'} <Upload className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById('photo-upload-input')?.click()}
                    className="border-2 border-dashed border-stone-700 hover:border-[#C5A880] hover:bg-[#222] rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[250px]"
                  >
                    <ImageIcon className="w-10 h-10 text-stone-600 mb-3" />
                    <span className="text-sm font-semibold text-stone-300">Toque para selecionar a foto</span>
                    <span className="text-[10px] text-stone-500 mt-1">Exportação rápida via telemóvel (JPG/PNG/WebP, Máx 2.5MB)</span>
                    <input
                      type="file"
                      id="photo-upload-input"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
