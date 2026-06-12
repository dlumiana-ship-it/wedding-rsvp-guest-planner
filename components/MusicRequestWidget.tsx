'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Plus, Check, Send, X } from 'lucide-react';

interface MusicRequestWidgetProps {
  currentMusic?: string;
  userId?: string;
  userName?: string;
  onMusicSaved: (newMusic: string) => void;
}

export default function MusicRequestWidget({
  currentMusic,
  userId,
  userName,
  onMusicSaved,
}: MusicRequestWidgetProps) {
  const [newSong, setNewSong] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savedSongs, setSavedSongs] = useState<string[]>(() => {
    // Parse existing music request into list
    if (currentMusic) {
      return currentMusic.split('|').map(s => s.trim()).filter(Boolean);
    }
    return [];
  });

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.trim()) return;

    setSending(true);
    const songEntry = newArtist.trim()
      ? `${newSong.trim()} - ${newArtist.trim()}`
      : newSong.trim();

    const updatedSongs = [...savedSongs, songEntry];
    const combined = updatedSongs.join(' | ');

    try {
      if (userId) {
        const res = await fetch('/api/guests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, musicRequest: combined }),
        });
        if (res.ok) {
          setSavedSongs(updatedSongs);
          onMusicSaved(combined);
          setNewSong('');
          setNewArtist('');
          setShowForm(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleRemoveSong = async (index: number) => {
    const updated = savedSongs.filter((_, i) => i !== index);
    const combined = updated.join(' | ');
    try {
      if (userId) {
        await fetch('/api/guests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, musicRequest: combined }),
        });
        setSavedSongs(updated);
        onMusicSaved(combined);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#001B3D]/5 to-[#800020]/5 border border-[#001B3D]/10 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#800020] rounded-full flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-serif text-base font-semibold text-[#001B3D]">
              Pedidos de Música 🎵
            </h4>
            <p className="text-[10px] text-stone-500">
              Pode pedir quantas músicas quiser — a qualquer momento
            </p>
          </div>
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-[10px] font-bold"
            >
              <Check className="w-3 h-3" /> Guardado!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Saved songs list */}
      {savedSongs.length > 0 && (
        <div className="mb-4 space-y-2">
          {savedSongs.map((song, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-3 py-2"
            >
              <Music className="w-3.5 h-3.5 text-[#800020] shrink-0" />
              <span className="text-sm text-stone-800 flex-1 truncate font-medium">
                &ldquo;{song}&rdquo;
              </span>
              {userId && (
                <button
                  onClick={() => handleRemoveSong(i)}
                  className="text-stone-300 hover:text-rose-500 transition-colors"
                  title="Remover pedido"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {savedSongs.length === 0 && !showForm && (
        <p className="text-stone-400 text-xs italic mb-4 text-center py-2">
          Nenhum pedido ainda. Adiciona a tua música favorita! 🎶
        </p>
      )}

      {/* Add song form */}
      <AnimatePresence>
        {showForm ? (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSong}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1 pb-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-[#001B3D]/60 tracking-wider">
                  Nome da Música *
                </label>
                <input
                  required
                  autoFocus
                  value={newSong}
                  onChange={e => setNewSong(e.target.value)}
                  placeholder="Ex: Evidências, Perfect, Jerusalema..."
                  className="w-full border-b border-[#001B3D]/20 py-2 focus:border-[#800020] focus:outline-none text-sm placeholder:italic bg-transparent text-[#001B3D]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-[#001B3D]/60 tracking-wider">
                  Artista / Banda (opcional)
                </label>
                <input
                  value={newArtist}
                  onChange={e => setNewArtist(e.target.value)}
                  placeholder="Ex: Ed Sheeran, Lizha James..."
                  className="w-full border-b border-[#001B3D]/20 py-2 focus:border-[#800020] focus:outline-none text-sm placeholder:italic bg-transparent text-[#001B3D]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewSong(''); setNewArtist(''); }}
                  className="flex-1 py-2 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending || !newSong.trim()}
                  className="flex-1 py-2 text-xs text-white bg-[#800020] hover:bg-[#500312] disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {sending ? (
                    <span className="animate-pulse">A guardar...</span>
                  ) : (
                    <>
                      <Send className="w-3 h-3" /> Enviar Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowForm(true)}
            className="w-full py-2.5 border-2 border-dashed border-[#800020]/30 hover:border-[#800020]/60 hover:bg-[#800020]/5 text-[#800020] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {savedSongs.length === 0 ? 'Pedir uma Música' : 'Pedir Mais Uma Música'}
          </motion.button>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-stone-400 text-center mt-3">
        Os seus pedidos são enviados directamente ao DJ 🎧
      </p>
    </div>
  );
}
