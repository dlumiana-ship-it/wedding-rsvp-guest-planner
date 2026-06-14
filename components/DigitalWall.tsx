'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Play, Pause, Sparkles, Send } from 'lucide-react';

interface WallMessage {
  id: string;
  guestName: string;
  content: string;
  createdAt: string;
}

interface DigitalWallProps {
  currentUser?: { id: string; name: string };
}

export default function DigitalWall({ currentUser }: DigitalWallProps) {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const projectorIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000); // Poll every 8 seconds for new messages
    return () => clearInterval(interval);
  }, []);

  // Projector auto-scrolling loop
  useEffect(() => {
    if (isProjectorMode) {
      projectorIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
          // Scroll down by 1px
          if (scrollTop + clientHeight >= scrollHeight - 2) {
            // Reset to top if reached bottom
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            scrollContainerRef.current.scrollBy({ top: 50, behavior: 'smooth' });
          }
        }
      }, 3500); // Scroll every 3.5 seconds
    } else {
      if (projectorIntervalRef.current) {
        clearInterval(projectorIntervalRef.current);
      }
    }

    return () => {
      if (projectorIntervalRef.current) clearInterval(projectorIntervalRef.current);
    };
  }, [isProjectorMode, messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/wall');
      const data = await res.json();
      if (res.ok && data.success) {
        // Only show approved messages
        setMessages(data.messages.filter((m: any) => m.approved));
      }
    } catch (e) {
      console.error('Failed to fetch wall messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setSending(true);
    const guestName = currentUser?.name || 'Convidado';
    const guestId = currentUser?.id || null;

    try {
      const res = await fetch('/api/wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestId,
          content: messageInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(prev => [data.message, ...prev]);
        setMessageInput('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`transition-all duration-500 rounded-3xl p-6 border ${
      isProjectorMode 
        ? 'fixed inset-0 z-50 bg-[#001B3D] text-white border-transparent rounded-none p-10 flex flex-col justify-between' 
        : 'bg-white border-[#001B3D]/10 text-stone-900 shadow-xs'
    }`}>
      {/* 1. Header controls */}
      <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProjectorMode ? 'bg-[#800020]' : 'bg-wedding-burgundy'}`}>
            <Heart className="w-4 h-4 text-white fill-current" />
          </div>
          <div>
            <h3 className={`font-serif text-lg ${isProjectorMode ? 'text-wedding-gold' : 'text-wedding-navy'}`}>
              Mural de Recordações
            </h3>
            <p className="text-[10px] text-stone-400">Mensagens e votos deixados pelos convidados</p>
          </div>
        </div>

        <button
          onClick={() => setIsProjectorMode(!isProjectorMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isProjectorMode 
              ? 'bg-wedding-gold text-stone-950 hover:bg-amber-400' 
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
          }`}
          title={isProjectorMode ? 'Sair do Modo Projeção' : 'Ativar Modo Projeção para Telão'}
        >
          {isProjectorMode ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Modo Normal
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Modo Projeção (Telão)
            </>
          )}
        </button>
      </div>

      {/* 2. Messages list */}
      <div 
        ref={scrollContainerRef}
        className={`overflow-y-auto scrollbar-none transition-all duration-300 ${
          isProjectorMode ? 'flex-1 py-8 px-4 max-h-[72vh] space-y-6' : 'max-h-[350px] space-y-3 pr-1'
        }`}
      >
        {loading ? (
          <div className="text-center py-12 text-stone-400">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30 animate-spin" />
            <p className="text-xs">A carregar mensagens do mural...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-xs italic">Ainda não existem votos no mural. Seja o primeiro a escrever!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className={isProjectorMode ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-2xl border transition-all duration-300 ${
                    isProjectorMode 
                      ? 'bg-white/5 border-white/10 p-6 flex flex-col justify-between shadow-xl backdrop-blur-md min-h-[160px]' 
                      : 'bg-stone-50 border-stone-100 p-4'
                  }`}
                >
                  <p className={`italic leading-relaxed ${isProjectorMode ? 'text-stone-200 text-sm' : 'text-stone-700 text-xs'}`}>
                    &ldquo;{msg.content}&rdquo;
                  </p>
                  <div className={`mt-3 flex items-center justify-between border-t pt-2 ${
                    isProjectorMode ? 'border-white/10' : 'border-stone-200/40'
                  }`}>
                    <span className={`font-serif font-semibold ${isProjectorMode ? 'text-wedding-gold text-xs' : 'text-wedding-navy text-[11px]'}`}>
                      — {msg.guestName}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      {new Date(msg.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* 3. Post form (hidden in projector mode) */}
      {!isProjectorMode && (
        <form onSubmit={handlePostMessage} className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={currentUser ? "Envie os seus votos para o mural..." : "Faça login para poder escrever no mural"}
            disabled={!currentUser || sending}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-800 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!currentUser || !messageInput.trim() || sending}
            className="w-10 h-10 rounded-xl bg-wedding-navy hover:bg-[#800020] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {isProjectorMode && (
        <div className="mt-6 border-t border-white/10 pt-4 flex justify-between items-center text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-wedding-gold fill-wedding-gold animate-pulse" />
            <span className="font-serif tracking-wider">Lumiana & Vicente • 12.09.2026</span>
          </div>
          <span className="animate-pulse">Modo Telão Ativo • Envie os seus votos pelo telemóvel</span>
        </div>
      )}
    </div>
  );
}
