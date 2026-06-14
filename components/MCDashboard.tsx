'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, Music, Check, ChevronUp, ChevronDown, Plus, Trash2, 
  Volume2, LogOut, Clock, Play, Square, RefreshCw, AlertCircle,
  Speech, CheckSquare, Save, Edit3, X, Sparkles, Star, Mic, ListChecks,
  Bell, Pause, RotateCcw, VolumeX, PlusCircle
} from 'lucide-react';

interface GiftPresenter {
  id: string;
  guestName: string;
  guestId?: string | null;
  position: number;
  hasGiven: boolean;
  note?: string | null;
  group?: string | null;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  status: string;
}

interface MCMoment {
  id: string;
  label: string;
  songId: string;
  notes: string;
  duration: number; // in minutes
  status: 'pending' | 'active' | 'completed';
}

interface SpeechPreset {
  id: string;
  title: string;
  text: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

const MC_MOMENTS_DEFAULTS: MCMoment[] = [
  { id: 'm-1', label: 'Entrada dos Noivos', songId: '', notes: 'Garantir volume alto, convidados de pé', duration: 15, status: 'pending' },
  { id: 'm-2', label: 'Primeira Dança', songId: '', notes: 'Efeito de fumo baixo e luz âmbar ativados', duration: 10, status: 'pending' },
  { id: 'm-3', label: 'Corte do Bolo', songId: '', notes: 'Espumantes servidos, chamar noivos à mesa principal', duration: 15, status: 'pending' },
  { id: 'm-4', label: 'Lançamento do Bouquet', songId: '', notes: 'Chamar todas as solteiras à pista de dança', duration: 10, status: 'pending' },
  { id: 'm-5', label: 'Agradecimentos & Brinde', songId: '', notes: 'Padrinhos reunidos com taças para o brinde final', duration: 15, status: 'pending' },
];

const SPEECH_PRESETS_DEFAULTS: SpeechPreset[] = [
  { 
    id: 's-1',
    title: 'Abertura do Banquete', 
    text: '“Senhoras e senhores, familiares e amigos. Em nome de Lumiana e Vicente, gostaríamos de convidá-los a tomar os vossos assentos nas mesas indicadas. O banquete será servido em instantes. Que a vossa noite seja memorável!”' 
  },
  { 
    id: 's-2',
    title: 'Início da Cerimónia de Oferendas', 
    text: '“Damos início agora a um momento de partilha e carinho. Convidamos as famílias e amigos, conforme a nossa sequência de protocolo, a apresentarem as suas oferendas e votos de felicidade aos noivos no altar de honra.”' 
  },
  { 
    id: 's-3',
    title: 'Brinde dos Noivos', 
    text: '“Fechamos os corações de alegria e erguemos as nossas taças. Um brinde à cumplicidade, à fé e ao amor eterno de Lumiana e Vicente. Que a vossa caminhada seja repleta de bênçãos abundantes!”' 
  },
  { 
    id: 's-4',
    title: 'Corte do Bolo Real', 
    text: '“Convidamos todos a direcionarem a vossa atenção para o centro do salão. É com imensa alegria que assistiremos ao corte oficial do bolo de casamento dos nossos noivos. Que a doçura deste momento marque as vossas vidas!”' 
  }
];

const CHECKLIST_DEFAULTS: ChecklistItem[] = [
  { id: 'c-1', text: 'Verificar pilhas e volume do microfone principal', done: false },
  { id: 'c-2', text: 'Confirmar se os noivos estão prontos na entrada', done: false },
  { id: 'c-3', text: 'Validar com o DJ a faixa da entrada principal', done: false },
  { id: 'c-4', text: 'Garantir que os padrinhos têm taças servidas para o brinde', done: false },
  { id: 'c-5', text: 'Confirmar posicionamento dos fotógrafos antes do bolo', done: false },
];

export default function MCDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'gifts' | 'timeline' | 'prompter' | 'checklist'>('gifts');
  
  // Presenters State
  const [presenters, setPresenters] = useState<GiftPresenter[]>([]);
  const [loadingPresenters, setLoadingPresenters] = useState(true);
  const [showAddPresenter, setShowAddPresenter] = useState(false);
  const [newPresenter, setNewPresenter] = useState({ guestName: '', note: '', group: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Songs list (for moment association)
  const [songs, setSongs] = useState<Song[]>([]);

  // MC Timeline Moments state
  const [mcMoments, setMcMoments] = useState<MCMoment[]>([]);
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null);
  const [showAddMoment, setShowAddMoment] = useState(false);
  const [newMoment, setNewMoment] = useState({ label: '', songId: '', notes: '', duration: 10 });

  // Prompter Speeches state
  const [speeches, setSpeeches] = useState<SpeechPreset[]>([]);
  const [editingSpeechId, setEditingSpeechId] = useState<string | null>(null);
  const [showAddSpeech, setShowAddSpeech] = useState(false);
  const [newSpeech, setNewSpeech] = useState({ title: '', text: '' });
  const [activeSpeech, setActiveSpeech] = useState<SpeechPreset | null>(null);

  // Stage Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);

  // Active Session Timer States
  const [activeMomentId, setActiveMomentId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Notifications State
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' }>>([]);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const playBeep = (freq: number, duration: number) => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const triggerAudioAlert = (type: 'warning' | 'transition') => {
    if (type === 'warning') {
      playBeep(440, 0.45); // A4 pitch
    } else {
      playBeep(523.25, 0.25); // C5 pitch double beep
      setTimeout(() => playBeep(523.25, 0.3), 300);
    }
  };

  // Sync data from db + localStorage on mount
  useEffect(() => {
    fetchPresenters();
    fetchSongs();
    
    if (typeof window !== 'undefined') {
      // Load Moments
      const savedMoments = localStorage.getItem('wedding_mc_moments');
      if (savedMoments) {
        try {
          const parsed = JSON.parse(savedMoments);
          setMcMoments(parsed);
          const active = parsed.find((m: MCMoment) => m.status === 'active');
          if (active) {
            setActiveMomentId(active.id);
            // Re-load saved timer state if exists
            const savedTime = localStorage.getItem('wedding_mc_timer_seconds');
            if (savedTime) setTimerSeconds(parseInt(savedTime, 10));
            else setTimerSeconds(active.duration * 60);
          }
        } catch (e) {
          setMcMoments(MC_MOMENTS_DEFAULTS);
        }
      } else {
        setMcMoments(MC_MOMENTS_DEFAULTS);
      }

      // Load Speeches
      const savedSpeeches = localStorage.getItem('wedding_mc_speeches');
      if (savedSpeeches) {
        try {
          const parsed = JSON.parse(savedSpeeches);
          setSpeeches(parsed);
          if (parsed.length > 0) setActiveSpeech(parsed[0]);
        } catch (e) {
          setSpeeches(SPEECH_PRESETS_DEFAULTS);
          setActiveSpeech(SPEECH_PRESETS_DEFAULTS[0]);
        }
      } else {
        setSpeeches(SPEECH_PRESETS_DEFAULTS);
        setActiveSpeech(SPEECH_PRESETS_DEFAULTS[0]);
      }

      // Load Checklist
      const savedChecklist = localStorage.getItem('wedding_mc_checklist');
      if (savedChecklist) {
        try {
          setChecklist(JSON.parse(savedChecklist));
        } catch (e) {
          setChecklist(CHECKLIST_DEFAULTS);
        }
      } else {
        setChecklist(CHECKLIST_DEFAULTS);
      }

      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (timerActive && activeMomentId && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          const newSecs = s - 1;
          localStorage.setItem('wedding_mc_timer_seconds', newSecs.toString());

          // Transition triggers
          if (newSecs === 60) {
            // 1 min warning
            triggerAudioAlert('warning');
            addToast("Falta 1 minuto para o fim da sessão ativa!", "warning");
            if (Notification.permission === 'granted') {
              new Notification("Tempo Quase Esgotado ⏱️", {
                body: "Falta 1 minuto para concluir o momento atual do roteiro.",
                tag: "mc-timer-warning"
              });
            }
          } else if (newSecs <= 0) {
            // Session expired
            setTimerActive(false);
            triggerAudioAlert('transition');
            addToast("Tempo esgotado! Faça a transição de protocolo.", "warning");
            
            const active = mcMoments.find(m => m.id === activeMomentId);
            const activeIdx = mcMoments.findIndex(m => m.id === activeMomentId);
            const nextMoment = activeIdx + 1 < mcMoments.length ? mcMoments[activeIdx + 1] : null;

            if (Notification.permission === 'granted') {
              new Notification("Transição de Protocolo 🔔", {
                body: `O momento "${active?.label}" terminou. Prepare a transição para "${nextMoment ? nextMoment.label : 'Conclusão'}"!`,
                tag: "mc-timer-expire"
              });
            }

            // Mark active as completed
            setMcMoments(prev => {
              const updated = prev.map(m => m.id === activeMomentId ? { ...m, status: 'completed' as const } : m);
              localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
              return updated;
            });
            setActiveMomentId(null);
            localStorage.removeItem('wedding_mc_timer_seconds');
          }
          return newSecs;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, activeMomentId, timerSeconds, mcMoments]);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("Notificações Ativas", {
          body: "A consola do MC irá alertar sobre as transições de roteiro em tempo real!",
        });
        addToast("Notificações ativadas no navegador!", "success");
      }
    }
  };

  const fetchPresenters = async () => {
    setLoadingPresenters(true);
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      if (data.success) {
        setPresenters(data.presenters.sort((a: GiftPresenter, b: GiftPresenter) => a.position - b.position));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPresenters(false);
    }
  };

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.success) {
        setSongs(data.songs.filter((s: Song) => s.status === 'APPROVED'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── ROTEIRO (MOMENTS) ACTIONS ──────────────────────────────────────────────
  const handleAddMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoment.label.trim()) return;

    const moment: MCMoment = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      label: newMoment.label.trim(),
      songId: newMoment.songId,
      notes: newMoment.notes.trim(),
      duration: newMoment.duration || 10,
      status: 'pending'
    };

    const updated = [...mcMoments, moment];
    setMcMoments(updated);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
    setNewMoment({ label: '', songId: '', notes: '', duration: 10 });
    setShowAddMoment(false);
    addToast("Momento adicionado ao roteiro!", "success");
  };

  const handleUpdateMomentDetails = (id: string, fields: Partial<MCMoment>) => {
    const updated = mcMoments.map(m => m.id === id ? { ...m, ...fields } : m);
    setMcMoments(updated);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
  };

  const handleDeleteMoment = (id: string) => {
    if (!confirm('Eliminar este momento do roteiro definitivamente?')) return;
    const updated = mcMoments.filter(m => m.id !== id);
    setMcMoments(updated);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
    if (activeMomentId === id) {
      setActiveMomentId(null);
      setTimerActive(false);
      setTimerSeconds(0);
      localStorage.removeItem('wedding_mc_timer_seconds');
    }
    addToast("Momento removido do roteiro.");
  };

  const reorderMoment = (idx: number, direction: 'up' | 'down') => {
    const newMoments = [...mcMoments];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newMoments.length) return;

    const temp = newMoments[idx];
    newMoments[idx] = newMoments[targetIdx];
    newMoments[targetIdx] = temp;

    setMcMoments(newMoments);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(newMoments));
  };

  const startSession = (moment: MCMoment) => {
    // Complete previous active moments
    const updated = mcMoments.map(m => {
      if (m.id === moment.id) return { ...m, status: 'active' as const };
      if (m.status === 'active') return { ...m, status: 'completed' as const };
      return m;
    });

    setMcMoments(updated);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
    setActiveMomentId(moment.id);
    setTimerSeconds(moment.duration * 60);
    setTimerActive(true);
    addToast(`Sessão "${moment.label}" iniciada!`, "success");
  };

  const completeActiveSession = () => {
    if (!activeMomentId) return;
    const updated = mcMoments.map(m => m.id === activeMomentId ? { ...m, status: 'completed' as const } : m);
    setMcMoments(updated);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(updated));
    setActiveMomentId(null);
    setTimerActive(false);
    setTimerSeconds(0);
    localStorage.removeItem('wedding_mc_timer_seconds');
    addToast("Sessão concluída!");
  };

  // ── SPEECHES ACTIONS ───────────────────────────────────────────────────────
  const handleAddSpeech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeech.title.trim() || !newSpeech.text.trim()) return;

    const speech: SpeechPreset = {
      id: 's-' + Math.random().toString(36).substring(2, 9),
      title: newSpeech.title.trim(),
      text: newSpeech.text.trim(),
    };

    const updated = [...speeches, speech];
    setSpeeches(updated);
    localStorage.setItem('wedding_mc_speeches', JSON.stringify(updated));
    setNewSpeech({ title: '', text: '' });
    setShowAddSpeech(false);
    if (!activeSpeech) setActiveSpeech(speech);
    addToast("Discurso adicionado com sucesso!", "success");
  };

  const handleUpdateSpeech = (id: string, title: string, text: string) => {
    const updated = speeches.map(s => s.id === id ? { ...s, title, text } : s);
    setSpeeches(updated);
    localStorage.setItem('wedding_mc_speeches', JSON.stringify(updated));
    const current = updated.find(s => s.id === id);
    if (current && activeSpeech?.id === id) {
      setActiveSpeech(current);
    }
    setEditingSpeechId(null);
    addToast("Discurso atualizado!");
  };

  const handleDeleteSpeech = (id: string) => {
    if (!confirm('Eliminar este discurso definitivamente?')) return;
    const updated = speeches.filter(s => s.id !== id);
    setSpeeches(updated);
    localStorage.setItem('wedding_mc_speeches', JSON.stringify(updated));
    if (activeSpeech?.id === id) {
      setActiveSpeech(updated.length > 0 ? updated[0] : null);
    }
    addToast("Discurso removido.");
  };

  // ── CHECKLIST ACTIONS ──────────────────────────────────────────────────────
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const item: ChecklistItem = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      text: newChecklistItem.trim(),
      done: false
    };

    const updated = [...checklist, item];
    setChecklist(updated);
    localStorage.setItem('wedding_mc_checklist', JSON.stringify(updated));
    setNewChecklistItem('');
    addToast("Item adicionado à checklist!", "success");
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    localStorage.setItem('wedding_mc_checklist', JSON.stringify(updated));
  };

  const handleUpdateChecklistItem = (id: string, text: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, text } : item);
    setChecklist(updated);
    localStorage.setItem('wedding_mc_checklist', JSON.stringify(updated));
    setEditingChecklistId(null);
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    setChecklist(updated);
    localStorage.setItem('wedding_mc_checklist', JSON.stringify(updated));
  };

  // ── GLOBAL RESET ───────────────────────────────────────────────────────────
  const handleRestoreDefaults = () => {
    if (!confirm('Esta ação irá restaurar todos os momentos do roteiro, discursos e checklists para os valores originais por defeito. Continuar?')) return;
    
    setMcMoments(MC_MOMENTS_DEFAULTS);
    localStorage.setItem('wedding_mc_moments', JSON.stringify(MC_MOMENTS_DEFAULTS));
    
    setSpeeches(SPEECH_PRESETS_DEFAULTS);
    localStorage.setItem('wedding_mc_speeches', JSON.stringify(SPEECH_PRESETS_DEFAULTS));
    setActiveSpeech(SPEECH_PRESETS_DEFAULTS[0]);

    setChecklist(CHECKLIST_DEFAULTS);
    localStorage.setItem('wedding_mc_checklist', JSON.stringify(CHECKLIST_DEFAULTS));

    setActiveMomentId(null);
    setTimerActive(false);
    setTimerSeconds(0);
    localStorage.removeItem('wedding_mc_timer_seconds');

    addToast("Configurações originais restauradas!", "success");
  };

  // ── PRESENTERS ─────────────────────────────────────────────────────────────
  const handleAddPresenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresenter.guestName.trim()) return;

    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPresenter),
      });
      const data = await res.json();
      if (data.success) {
        setPresenters(prev => [...prev, data.presenter].sort((a, b) => a.position - b.position));
        setNewPresenter({ guestName: '', note: '', group: '' });
        setShowAddPresenter(false);
        addToast("Família adicionada à fila!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePresenterGiven = async (presenter: GiftPresenter) => {
    try {
      const res = await fetch('/api/gifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: presenter.id, hasGiven: !presenter.hasGiven }),
      });
      const data = await res.json();
      if (data.success) {
        setPresenters(prev => prev.map(p => p.id === presenter.id ? data.presenter : p));
        addToast(presenter.hasGiven ? "Oferenda pendente." : "Oferenda concluída com sucesso!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePresenter = async (id: string) => {
    if (!confirm('Deseja retirar este apresentador da sequência?')) return;
    try {
      const res = await fetch(`/api/gifts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPresenters(prev => prev.filter(p => p.id !== id));
        addToast("Apresentador removido da sequência.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const movePresenter = async (presenter: GiftPresenter, direction: 'up' | 'down') => {
    const sorted = [...presenters].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(p => p.id === presenter.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    const [newPos, otherPos] = [other.position, presenter.position];

    // Optimistic Update
    setPresenters(prev => prev.map(p => {
      if (p.id === presenter.id) return { ...p, position: newPos };
      if (p.id === other.id) return { ...p, position: otherPos };
      return p;
    }).sort((a, b) => a.position - b.position));

    try {
      await Promise.all([
        fetch('/api/gifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: presenter.id, position: newPos }) }),
        fetch('/api/gifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: other.id, position: otherPos }) }),
      ]);
    } catch (e) {
      console.error('Error swapping positions:', e);
      fetchPresenters(); // rollback
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeMoment = mcMoments.find(m => m.id === activeMomentId);
  const activeIdx = mcMoments.findIndex(m => m.id === activeMomentId);
  const nextMoment = activeIdx !== -1 && activeIdx + 1 < mcMoments.length ? mcMoments[activeIdx + 1] : null;

  const timerPercent = activeMoment 
    ? Math.min(100, Math.max(0, ((activeMoment.duration * 60 - timerSeconds) / (activeMoment.duration * 60)) * 100)) 
    : 0;

  const givenCount = presenters.filter(p => p.hasGiven).length;
  const sortedPresenters = [...presenters].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-[#00142A] text-stone-100 flex flex-col font-sans selection:bg-[#C5A880]/20 selection:text-[#C5A880]">
      
      {/* ── FLOAT NOTIFICATION TOASTS ───────────────────────────────── */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className={`p-4 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-auto ${
                t.type === 'success' 
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                  : t.type === 'warning'
                    ? 'bg-amber-950/90 border-amber-500/30 text-amber-300'
                    : 'bg-[#001B3D]/95 border-[#C5A880]/20 text-stone-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── TOP NAV BAR (MC Gold/Navy Accent) ───────────────────────── */}
      <header className="h-20 bg-[#001B3D]/90 backdrop-blur-md border-b border-[#C5A880]/20 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C5A880] to-amber-500 flex items-center justify-center shadow-lg shadow-[#C5A880]/10 shrink-0">
            <Mic className="w-5 h-5 text-[#00142A]" />
          </div>
          <div className="text-left">
            <h1 className="font-serif text-sm sm:text-base font-semibold text-white">
              Lumiana & Vicente
            </h1>
            <p className="text-[9px] sm:text-[10px] text-[#C5A880] font-bold uppercase tracking-widest font-mono">
              Mestre de Cerimónias • Consola de Palco
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Push Notifications request button */}
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001F45] border border-[#C5A880]/15 hover:border-[#C5A880]/40 text-stone-300 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Notificações Push</span>
            </button>
          )}

          {notificationPermission === 'granted' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/35 border border-emerald-500/20 text-emerald-400 rounded-full px-3 py-1 text-[10px] font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PUSH ATIVO</span>
            </div>
          )}

          {/* Quick restore defaults buttons */}
          <button
            onClick={handleRestoreDefaults}
            className="p-2 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-stone-400 rounded-xl transition-all cursor-pointer"
            title="Restaurar Definições Originais"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-stone-900 border border-stone-850 hover:border-rose-800/40 hover:bg-rose-950/10 text-xs text-stone-400 hover:text-rose-400 rounded-xl transition-all font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair do Palco</span>
          </button>
        </div>
      </header>

      {/* ── SESSION TIMER BAR (ACTIVE SESSION BANNER) ───────────────── */}
      <AnimatePresence>
        {activeMomentId && activeMoment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#001B3D] border-b border-[#C5A880]/15 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 text-left"
          >
            <div className="flex-1 w-full">
              <span className="text-[#C5A880] text-[9px] font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C5A880] animate-pulse" /> Sessão Ativa no Roteiro
              </span>
              <h2 className="font-serif text-lg font-bold text-white mt-1">{activeMoment.label}</h2>
              {activeMoment.notes && <p className="text-[11px] text-stone-400 mt-0.5">{activeMoment.notes}</p>}
              
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-stone-950 rounded-full mt-3 overflow-hidden border border-stone-900">
                <div 
                  className="h-full bg-gradient-to-r from-[#C5A880] to-amber-500 transition-all duration-1000"
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-stone-850 pt-3 md:pt-0">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-[9px] text-stone-400 font-bold uppercase">Tempo Restante</span>
                <span className={`text-2xl font-bold font-mono ${timerSeconds < 60 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                  {formatTimer(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTimerActive(a => !a)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    timerActive 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                  title={timerActive ? "Pausar" : "Iniciar"}
                >
                  {timerActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                
                <button
                  onClick={() => setTimerSeconds(s => s + 60)}
                  className="px-3 py-2 bg-[#001F45] border border-stone-800 hover:border-stone-700 text-stone-300 rounded-xl text-xs font-semibold cursor-pointer"
                  title="Adicionar 1 minuto"
                >
                  +1 min
                </button>

                <button
                  onClick={completeActiveSession}
                  className="p-2.5 bg-rose-600/10 border border-rose-600/30 hover:border-rose-600/50 text-rose-400 rounded-xl cursor-pointer"
                  title="Parar / Concluir"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── METRICS SUMMARY ────────────────────────────────────────────── */}
      <div className="bg-[#001B3D]/30 border-b border-[#001B3D] px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-7xl w-full mx-auto mt-6 rounded-2xl">
        <div className="bg-[#001837] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-1">Oferendas Concluídas</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#C5A880]">
            {givenCount} <span className="text-xs text-stone-500 font-sans">/ {presenters.length}</span>
          </span>
        </div>
        <div className="bg-[#001837] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-1">Aguardando Fila</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{presenters.length - givenCount} <span className="text-xs text-stone-500 font-sans">famílias</span></span>
        </div>
        <div className="bg-[#001837] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-1">Momentos MC</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
            {mcMoments.filter(m => m.status === 'completed').length} <span className="text-xs text-stone-500 font-sans">/ {mcMoments.length} Feitos</span>
          </span>
        </div>
        <div className="bg-[#001837] border border-stone-900 rounded-xl p-4 flex flex-col justify-center text-left">
          <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-1">Itens Checklist</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {checklist.filter(c => c.done).length} <span className="text-xs text-stone-500 font-sans">/ {checklist.length} Prontos</span>
          </span>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-850 pb-4 gap-6 shrink-0 text-left">
          {[
            { id: 'gifts', label: 'Fila de Oferendas', icon: Gift },
            { id: 'timeline', label: 'Roteiro & Protocolo', icon: Music },
            { id: 'prompter', label: 'Prompter de Discursos', icon: Speech },
            { id: 'checklist', label: 'Checklist de Palco', icon: ListChecks },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-[#C5A880] text-[#C5A880] font-bold'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ──────────────── TAB: GIFTS SEQUENCE ──────────────── */}
        {activeTab === 'gifts' && (
          <div className="flex-1 min-h-0 text-left space-y-6">
            
            {/* Inner Header */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-3 gap-4">
              <div>
                <h2 className="font-serif text-lg text-white font-medium">Ordem de Apresentação das Oferendas</h2>
                <p className="text-stone-400 text-xs mt-0.5">Gerencie a fila de subida ao palco de forma dinâmica.</p>
              </div>
              <button
                onClick={() => setShowAddPresenter(true)}
                className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#b0926d] text-[#00142A] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar na Fila
              </button>
            </div>

            {/* Form Add Presenter Inline */}
            <AnimatePresence>
              {showAddPresenter && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleAddPresenter}
                  className="bg-[#001B3D]/80 border border-[#C5A880]/15 rounded-2xl p-5 space-y-4 max-w-xl"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h3 className="font-serif text-sm font-semibold text-white">Adicionar à Fila</h3>
                    <button type="button" onClick={() => setShowAddPresenter(false)} className="text-stone-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Nome / Família *</label>
                      <input
                        required
                        value={newPresenter.guestName}
                        onChange={e => setNewPresenter(p => ({ ...p, guestName: e.target.value }))}
                        placeholder="Ex: Família Machava"
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Grupo / Lado</label>
                      <input
                        value={newPresenter.group}
                        onChange={e => setNewPresenter(p => ({ ...p, group: e.target.value }))}
                        placeholder="Ex: Lado da Noiva"
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Nota Especial (MC Notas)</label>
                      <input
                        value={newPresenter.note}
                        onChange={e => setNewPresenter(p => ({ ...p, note: e.target.value }))}
                        placeholder="Ex: Padrinhos de honra, trazer bouquet adicional..."
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button type="button" onClick={() => setShowAddPresenter(false)} className="px-3 py-1.5 text-xs text-stone-450 hover:bg-[#00254D] rounded-lg">Cancelar</button>
                    <button type="submit" className="px-5 py-1.5 bg-[#C5A880] text-[#00142A] text-xs font-bold rounded-lg uppercase tracking-wider">Confirmar</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Presenters Sequence */}
            {loadingPresenters ? (
              <div className="text-center py-12 text-stone-500">A carregar fila de oferendas...</div>
            ) : sortedPresenters.length === 0 ? (
              <div className="text-center py-16 bg-[#001B3D]/20 border border-dashed border-[#C5A880]/15 rounded-3xl text-stone-550">
                <Gift className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhum ofertante na fila.</p>
                <p className="text-xs mt-1">Adicione famílias para conduzir o protocolo do palco.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {sortedPresenters.map((presenter, idx) => (
                  <div
                    key={presenter.id}
                    className={`border border-[#C5A880]/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                      presenter.hasGiven 
                        ? 'bg-[#001B3D]/20 border-[#C5A880]/5 opacity-60' 
                        : 'bg-[#001B3D]/60 hover:border-[#C5A880]/20'
                    }`}
                  >
                    {/* Position Badge & Details */}
                    <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                        presenter.hasGiven ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'bg-[#C5A880]/20 text-[#C5A880]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${presenter.hasGiven ? 'line-through text-stone-500' : 'text-white'}`}>
                            {presenter.guestName}
                          </span>
                          {presenter.group && (
                            <span className="text-[9px] bg-[#00224C] border border-[#C5A880]/20 text-stone-300 px-2 py-0.5 rounded-full">
                              {presenter.group}
                            </span>
                          )}
                        </div>
                        {presenter.note && (
                          <p className="text-[11px] text-amber-250 italic mt-0.5">⚠️ Nota: {presenter.note}</p>
                        )}
                      </div>
                    </div>

                    {/* Status and Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 border-stone-850 pt-2.5 sm:pt-0 shrink-0">
                      <button
                        onClick={() => togglePresenterGiven(presenter)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                          presenter.hasGiven
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#00224C] border-[#C5A880]/20 text-stone-300 hover:border-emerald-500 hover:text-emerald-400'
                        }`}
                      >
                        {presenter.hasGiven ? '✓ Entregue' : 'Marcar Entregue'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePresenter(presenter, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-stone-500 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => movePresenter(presenter, 'down')}
                          disabled={idx === sortedPresenters.length - 1}
                          className="p-1.5 text-stone-500 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePresenter(presenter.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB: TIMELINE (ROTEIRO) & PROTOCOL ──────────────── */}
        {activeTab === 'timeline' && (
          <div className="flex-1 min-h-0 text-left space-y-6">
            
            {/* Header with add button */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-3 gap-4">
              <div>
                <h2 className="font-serif text-lg text-white font-medium">Momentos do Protocolo e Roteiro</h2>
                <p className="text-stone-400 text-xs mt-0.5">Defina, ordene e configure a duração dos momentos em tempo real.</p>
              </div>
              <button
                onClick={() => setShowAddMoment(true)}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#b0926d] text-[#00142A] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Momento
              </button>
            </div>

            {/* Form Add Moment */}
            <AnimatePresence>
              {showAddMoment && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleAddMoment}
                  className="bg-[#001B3D]/80 border border-[#C5A880]/15 rounded-2xl p-5 space-y-4 max-w-xl"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h3 className="font-serif text-sm font-semibold text-white">Criar Novo Momento no Roteiro</h3>
                    <button type="button" onClick={() => setShowAddMoment(false)} className="text-stone-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Título do Momento *</label>
                      <input
                        required
                        value={newMoment.label}
                        onChange={e => setNewMoment(p => ({ ...p, label: e.target.value }))}
                        placeholder="Ex: Corte do Bolo Real"
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Duração Estimada (Minutos)</label>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={newMoment.duration}
                        onChange={e => setNewMoment(p => ({ ...p, duration: parseInt(e.target.value, 10) || 10 }))}
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Instruções / Notas do MC</label>
                      <input
                        value={newMoment.notes}
                        onChange={e => setNewMoment(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Ex: Chamar padrinhos para os lados, fumo seco..."
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[9px] uppercase font-bold text-stone-400">Música Associada</label>
                      <select
                        value={newMoment.songId}
                        onChange={e => setNewMoment(p => ({ ...p, songId: e.target.value }))}
                        className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C5A880] cursor-pointer"
                      >
                        <option value="">— Sem música selecionada —</option>
                        {songs.map(s => (
                          <option key={s.id} value={s.id}>{s.title} (de {s.artist})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button type="button" onClick={() => setShowAddMoment(false)} className="px-3 py-1.5 text-xs text-stone-450 hover:bg-[#00254D] rounded-lg">Cancelar</button>
                    <button type="submit" className="px-5 py-1.5 bg-[#C5A880] text-[#00142A] text-xs font-bold rounded-lg uppercase tracking-wider">Adicionar</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of Moments */}
            {mcMoments.length === 0 ? (
              <p className="text-center text-xs text-stone-500 py-12 italic">Nenhum momento de roteiro criado ainda.</p>
            ) : (
              <div className="space-y-4">
                {mcMoments.map((moment, idx) => {
                  const associatedSong = songs.find(s => s.id === moment.songId);
                  const isEditing = editingMomentId === moment.id;
                  const isActive = activeMomentId === moment.id;
                  
                  return (
                    <div 
                      key={moment.id} 
                      className={`bg-[#001B3D]/70 border rounded-2xl p-5 flex flex-col md:flex-row gap-4 transition-all duration-300 ${
                        isActive 
                          ? 'border-[#C5A880] bg-[#001F45]/90 shadow-lg shadow-[#C5A880]/5' 
                          : moment.status === 'completed' 
                            ? 'border-stone-900 opacity-60' 
                            : 'border-[#C5A880]/15 hover:border-[#C5A880]/30'
                      }`}
                    >
                      {/* Left: Moment index & Title */}
                      <div className="md:w-1/4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-stone-850 pb-3 md:pb-0 md:pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-amber-400/20 text-amber-400' 
                              : moment.status === 'completed'
                                ? 'bg-emerald-600/20 text-emerald-400'
                                : 'bg-stone-800 text-stone-400'
                          }`}>
                            {moment.status === 'active' ? 'EM CURSO' : moment.status === 'completed' ? 'FEITO' : 'PENDENTE'}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">Duração: {moment.duration}m</span>
                        </div>
                        
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={moment.label}
                            onBlur={(e) => handleUpdateMomentDetails(moment.id, { label: e.target.value })}
                            className="bg-[#00142A] border border-stone-800 rounded px-2 py-1 text-xs text-white font-medium focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <h3 className="font-serif text-sm font-semibold text-white flex items-center gap-1.5">
                            {moment.label}
                          </h3>
                        )}
                      </div>

                      {/* Middle: Music and Notes */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-stone-400">Música Associada</label>
                          <select
                            value={moment.songId}
                            onChange={e => handleUpdateMomentDetails(moment.id, { songId: e.target.value })}
                            className="bg-[#00142A] border border-stone-800 rounded-lg p-2 text-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C5A880] cursor-pointer"
                          >
                            <option value="">— Sem música selecionada —</option>
                            {songs.map(s => (
                              <option key={s.id} value={s.id}>{s.title} (de {s.artist})</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-stone-400">Notas do Roteiro</label>
                          <input
                            type="text"
                            value={moment.notes}
                            onChange={e => handleUpdateMomentDetails(moment.id, { notes: e.target.value })}
                            className="bg-[#00142A] border border-stone-800 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                          />
                        </div>

                        {associatedSong && (
                          <div className="sm:col-span-2 bg-[#C5A880]/5 rounded-xl px-4 py-1.5 text-[10px] text-stone-400 flex items-center gap-2 border border-[#C5A880]/10 w-fit">
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>
                              <strong>Música DJ:</strong> "{associatedSong.title}" - {associatedSong.artist}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Stage Control Panel */}
                      <div className="md:w-1/5 shrink-0 flex items-center justify-between md:justify-end gap-2 border-t md:border-0 border-stone-850 pt-3 md:pt-0">
                        {/* Session launcher */}
                        {!isActive && moment.status !== 'completed' && (
                          <button
                            onClick={() => startSession(moment)}
                            className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#b59871] text-[#00142A] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Iniciar
                          </button>
                        )}

                        {isActive && (
                          <span className="text-[10px] text-[#C5A880] font-bold uppercase tracking-widest animate-pulse border border-[#C5A880]/20 px-3 py-1.5 rounded-xl">
                            Ativo ⏱️
                          </span>
                        )}

                        {moment.status === 'completed' && (
                          <button
                            onClick={() => handleUpdateMomentDetails(moment.id, { status: 'pending' })}
                            className="px-3 py-1.5 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 text-[10px] uppercase font-bold rounded-xl cursor-pointer"
                          >
                            Refazer
                          </button>
                        )}

                        {/* Reordering & edit tools */}
                        <div className="flex items-center gap-0.5 border-l border-stone-850 pl-2 ml-1">
                          <button
                            onClick={() => reorderMoment(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-stone-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => reorderMoment(idx, 'down')}
                            disabled={idx === mcMoments.length - 1}
                            className="p-1 text-stone-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingMomentId(isEditing ? null : moment.id)}
                            className="p-1 text-stone-500 hover:text-white cursor-pointer"
                            title="Editar Título"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMoment(moment.id)}
                            className="p-1 text-stone-500 hover:text-rose-500 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Next Up Quick Action Banner */}
            {nextMoment && (
              <div className="bg-[#001F45]/40 border border-[#C5A880]/10 p-5 rounded-2xl flex items-center justify-between mt-8">
                <div className="text-left">
                  <span className="text-stone-500 text-[9px] font-bold uppercase tracking-widest block">Próximo Momento da Sequência</span>
                  <h4 className="font-serif text-sm font-semibold text-white mt-1">{nextMoment.label}</h4>
                  {nextMoment.notes && <p className="text-[11px] text-stone-400">{nextMoment.notes}</p>}
                </div>
                <button
                  onClick={() => startSession(nextMoment)}
                  className="px-4 py-2 bg-wedding-navy hover:bg-[#002B5E] border border-[#C5A880]/20 text-[#C5A880] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Avançar Transição
                </button>
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB: SPEECHES PROMPTER ──────────────── */}
        {activeTab === 'prompter' && (
          <div className="flex-1 min-h-0 text-left space-y-6">
            
            {/* Header and trigger */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-3 gap-4">
              <div>
                <h2 className="font-serif text-lg text-white font-medium">Prompter de Discursos do Palco</h2>
                <p className="text-stone-400 text-xs mt-0.5">Customize e adicione discursos e ensaios de palco.</p>
              </div>
              <button
                onClick={() => setShowAddSpeech(true)}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#b0926d] text-[#00142A] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Discurso
              </button>
            </div>

            {/* Form Add Speech */}
            <AnimatePresence>
              {showAddSpeech && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleAddSpeech}
                  className="bg-[#001B3D]/80 border border-[#C5A880]/15 rounded-2xl p-5 space-y-4 max-w-xl"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h3 className="font-serif text-sm font-semibold text-white">Criar Novo Preset de Discurso</h3>
                    <button type="button" onClick={() => setShowAddSpeech(false)} className="text-stone-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-stone-400">Título / Momento do Discurso *</label>
                    <input
                      required
                      value={newSpeech.title}
                      onChange={e => setNewSpeech(p => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: Abertura da Pista de Dança"
                      className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-stone-400">Texto do Discurso *</label>
                    <textarea
                      required
                      rows={5}
                      value={newSpeech.text}
                      onChange={e => setNewSpeech(p => ({ ...p, text: e.target.value }))}
                      placeholder="Escreva as palavras de protocolo..."
                      className="px-3 py-2 bg-[#00142A] border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button type="button" onClick={() => setShowAddSpeech(false)} className="px-3 py-1.5 text-xs text-stone-455 hover:bg-[#00254D] rounded-lg">Cancelar</button>
                    <button type="submit" className="px-5 py-1.5 bg-[#C5A880] text-[#00142A] text-xs font-bold rounded-lg uppercase tracking-wider">Gravar</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Prompter list selector */}
              <div className="lg:col-span-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Textos & Ensaios</h3>
                
                {speeches.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-4">Nenhum discurso registado.</p>
                ) : (
                  speeches.map((preset, idx) => {
                    const isActive = activeSpeech?.id === preset.id;
                    const isEditing = editingSpeechId === preset.id;
                    
                    return (
                      <div 
                        key={preset.id}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 relative group ${
                          isActive
                            ? 'bg-[#C5A880]/15 border-[#C5A880] text-white font-bold'
                            : 'bg-[#001B3D]/65 border-stone-850 text-stone-400 hover:text-stone-300'
                        }`}
                      >
                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => { if (!isEditing) setActiveSpeech(preset); }}
                        >
                          <span className="text-[9px] uppercase tracking-wider opacity-60 mb-1 block">Roteiro {idx + 1}</span>
                          
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={preset.title}
                              id={`speech-title-input-${preset.id}`}
                              className="bg-[#00142A] border border-stone-800 rounded text-xs text-white p-1 focus:outline-none w-full"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-xs font-serif font-medium block">{preset.title}</span>
                          )}
                        </div>

                        {/* Inline editor buttons */}
                        {isEditing && (
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            <textarea
                              id={`speech-text-input-${preset.id}`}
                              defaultValue={preset.text}
                              rows={4}
                              className="w-full bg-[#00142A] border border-stone-800 rounded text-[11px] text-stone-200 p-2 focus:outline-none resize-none"
                            />
                            <div className="flex justify-end gap-1.5 mt-2">
                              <button 
                                onClick={() => setEditingSpeechId(null)}
                                className="px-2.5 py-1 bg-stone-900 text-[10px] text-stone-400 rounded-lg"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => {
                                  const titleVal = (document.getElementById(`speech-title-input-${preset.id}`) as HTMLInputElement)?.value;
                                  const textVal = (document.getElementById(`speech-text-input-${preset.id}`) as HTMLTextAreaElement)?.value;
                                  if (titleVal && textVal) {
                                    handleUpdateSpeech(preset.id, titleVal, textVal);
                                  }
                                }}
                                className="px-3 py-1 bg-[#C5A880] text-[10px] text-[#00142A] font-bold rounded-lg"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSpeechId(preset.id); }}
                              className="p-1 bg-[#00142A] text-stone-400 hover:text-white rounded"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSpeech(preset.id); }}
                              className="p-1 bg-[#00142A] text-stone-400 hover:text-rose-500 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Prompter Visualizer */}
              <div className="lg:col-span-8 bg-[#001B3D]/70 border border-[#C5A880]/15 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl min-h-[350px]">
                {activeSpeech ? (
                  <div>
                    <span className="text-[#C5A880] text-[9px] uppercase tracking-[0.2em] font-bold block mb-4 border-b border-[#C5A880]/15 pb-2">
                      Teleprompter Ativo: {activeSpeech.title}
                    </span>
                    <p className="font-serif text-base sm:text-lg text-white leading-relaxed italic pr-2 font-medium whitespace-pre-line">
                      {activeSpeech.text}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-20 text-stone-500 italic">
                    Nenhum discurso selecionado. Crie ou ative um preset ao lado.
                  </div>
                )}

                <div className="mt-8 border-t border-stone-800/80 pt-4 text-[10px] text-stone-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C5A880]" />
                  <span>Dica: Ajuste a velocidade da fala mantendo uma entonação clara e elegante com o público.</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────── TAB: CHECKLIST DE PALCO ──────────────── */}
        {activeTab === 'checklist' && (
          <div className="flex-1 min-h-0 text-left space-y-6 max-w-xl mx-auto">
            
            {/* Header and Add Task */}
            <div className="border-b border-stone-850 pb-3">
              <h2 className="font-serif text-lg text-white font-medium">Lista de Verificação do MC</h2>
              <p className="text-stone-400 text-xs mt-0.5">Customize os seus lembretes e tarefas de palco.</p>
              
              <form onSubmit={handleAddChecklistItem} className="flex gap-2 mt-4">
                <input
                  type="text"
                  required
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  placeholder="Ex: Confirmar se os padrinhos têm taças servidas..."
                  className="flex-1 bg-[#00142A] border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                />
                <button
                  type="submit"
                  disabled={!newChecklistItem.trim()}
                  className="px-5 py-2.5 bg-[#C5A880] text-[#00142A] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#b0926d] disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" /> Adicionar
                </button>
              </form>
            </div>

            {/* Checklist items list */}
            <div className="bg-[#001B3D]/75 border border-[#C5A880]/15 rounded-3xl p-6 space-y-3 shadow-md">
              {checklist.length === 0 ? (
                <p className="text-center text-xs text-stone-500 italic py-6">Checklist vazia. Adicione tarefas acima.</p>
              ) : (
                checklist.map(item => {
                  const isEditing = editingChecklistId === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                        item.done 
                          ? 'bg-emerald-950/10 border-emerald-500/10 text-stone-500' 
                          : 'bg-[#00142A] border-stone-850 hover:border-stone-800 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Checkbox trigger */}
                        <button 
                          onClick={() => toggleChecklistItem(item.id)}
                          className="shrink-0 cursor-pointer"
                        >
                          {item.done ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg border-2 border-stone-700 hover:border-[#C5A880]" />
                          )}
                        </button>
                        
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={item.text}
                            onBlur={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateChecklistItem(item.id, e.currentTarget.value);
                            }}
                            className="bg-[#00142A] border border-stone-800 rounded px-2 py-1 text-xs text-white focus:outline-none w-full"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className={`text-xs truncate cursor-pointer ${item.done ? 'line-through text-stone-500' : 'font-medium text-stone-200'}`}
                            onClick={() => toggleChecklistItem(item.id)}
                          >
                            {item.text}
                          </span>
                        )}
                      </div>

                      {/* Item actions */}
                      <div className="flex items-center gap-0.5 shrink-0 pl-2">
                        <button
                          onClick={() => setEditingChecklistId(isEditing ? null : item.id)}
                          className="p-1 text-stone-500 hover:text-white cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="p-1 text-stone-500 hover:text-rose-500 cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#000F20] text-stone-600 py-6 border-t border-[#C5A880]/10 text-center shrink-0 mt-12">
        <p className="text-[10px] uppercase tracking-wider font-mono">
          Lumiana & Vicente • Consola do MC Segura • © 2026
        </p>
      </footer>
    </div>
  );
}
