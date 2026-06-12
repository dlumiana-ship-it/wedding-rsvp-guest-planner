'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateWeddingPDF, generateCSV } from '../lib/exportPDF';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Music, 
  Utensils, 
  Home, 
  Users, 
  Sparkles, 
  Send, 
  ChevronRight, 
  Download, 
  Plus, 
  Trash2, 
  Lock, 
  Check, 
  MessageSquare, 
  X, 
  ArrowRight,
  Printer,
  Compass,
  Volume2,
  Camera,
  Upload
} from 'lucide-react';
import AddGuestModal from './AddGuestModal';
import MusicRequestWidget from './MusicRequestWidget';
import dynamic from 'next/dynamic';

const StaffDashboard = dynamic(() => import('./StaffDashboard'), { ssr: false });



interface Guest {
  id: string;
  name: string;
  phone?: string;
  side: 'Bride' | 'Groom';
  role?: string;
  diet: string;
  dietDetails: string;
  musicRequest: string;
  needsAccommodation: 'Yes' | 'No';
  accommodationDetails: string;
  tableId: number | null;
  timestamp: string;
  checkIn?: boolean;
  qrCode?: string | null;
}

interface Table {
  id: number;
  name: string;
  capacity: number;
}

const INITIAL_GUESTS: Guest[] = [
  {
    id: 'g-1',
    name: 'Mariana Silva Santos',
    side: 'Bride',
    role: 'GUEST',
    diet: 'Vegano',
    dietDetails: 'Alergia severa a amendoim',
    musicRequest: 'Marry You - Bruno Mars',
    needsAccommodation: 'Yes',
    accommodationDetails: 'Preciso de quarto duplo, irei com meu noivo.',
    tableId: 1,
    timestamp: '2026-06-01T14:24:00Z',
  },
  {
    id: 'g-2',
    name: 'Roberto de Souza',
    side: 'Groom',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'Dusk Till Dawn - Sia',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: 1,
    timestamp: '2026-06-01T15:10:00Z',
  },
  {
    id: 'g-3',
    name: 'Ana Beatriz Oliveira',
    side: 'Bride',
    role: 'GUEST',
    diet: 'Sem Glúten',
    dietDetails: 'Intolerância celíaca',
    musicRequest: 'Love Story - Taylor Swift',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: 2,
    timestamp: '2026-06-02T10:05:00Z',
  },
  {
    id: 'g-4',
    name: 'Carlos Eduardo Nogueira',
    side: 'Groom',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'Sua Música Predileta - Amado Batista',
    needsAccommodation: 'Yes',
    accommodationDetails: 'Quarto individual simples.',
    tableId: 2,
    timestamp: '2026-06-02T11:45:00Z',
  },
  {
    id: 'g-5',
    name: 'Juliana Meireles Rocha',
    side: 'Bride',
    role: 'GUEST',
    diet: 'Vegetariano',
    dietDetails: '',
    musicRequest: 'Evidências - Chitãozinho & Xororó',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: null,
    timestamp: '2026-06-02T18:32:00Z',
  },
  {
    id: 'g-6',
    name: 'Marcos de Almeida Costa',
    side: 'Groom',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'Sertanejo Mix',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: null,
    timestamp: '2026-06-03T09:12:00Z',
  },
  {
    id: 'g-7',
    name: 'Sofia Mendes Albuquerque',
    side: 'Bride',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'Happy - Pharrell Williams',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: 3,
    timestamp: '2026-06-03T11:20:00Z',
  },
  {
    id: 'g-8',
    name: 'Lucas Pedreira Ramos',
    side: 'Groom',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'A Thousand Years - Christina Perri',
    needsAccommodation: 'Yes',
    accommodationDetails: 'Vou com esposa e duas filhas pequenas (quarto familiar).',
    tableId: 3,
    timestamp: '2026-06-03T12:01:00Z',
  }
];

export default function WeddingPlannerApp({ user, onLogout }: { user?: any, onLogout?: () => void }) {
  // Navigation driven by user.role

  // Database States with lazy state initialization, avoiding useEffect synchronous updates
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (typeof window !== 'undefined') {
      const savedGuests = localStorage.getItem('wedding_guests');
      if (savedGuests) {
        try {
          return JSON.parse(savedGuests);
        } catch (e) {
          console.error('Error parsing guests from localStorage', e);
        }
      }
    }
    return INITIAL_GUESTS;
  });

  // Fetch guests from database on load
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await fetch('/api/guests');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setGuests(data.guests);
          }
        }
      } catch (e) {
        console.error('Failed to fetch guests', e);
      }
    };
    fetchGuests();
  }, []);

  const [tableCount, setTableCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedTableCount = localStorage.getItem('wedding_table_count');
      if (savedTableCount) {
        const parsed = parseInt(savedTableCount, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 6;
  });

  const [tableNames, setTableNames] = useState<Record<number, string>>(() => {
    if (typeof window !== 'undefined') {
      const savedTableNames = localStorage.getItem('wedding_table_names');
      if (savedTableNames) {
        try {
          return JSON.parse(savedTableNames);
        } catch (e) {
          console.error('Error parsing table names', e);
        }
      }
    }
    return {};
  });

  const saveTableNamesToStorage = (updatedNames: Record<number, string>) => {
    setTableNames(updatedNames);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_table_names', JSON.stringify(updatedNames));
    }
  };

  // Purely computed derived property instead of separate state variable
  const tables = React.useMemo(() => {
    const generatedTables: Table[] = [];
    for (let i = 1; i <= tableCount; i++) {
      generatedTables.push({
        id: i,
        name: tableNames[i] ? `Mesa ${i} - ${tableNames[i]}` : `Mesa ${i}`,
        capacity: 6 // Elegante recomendação de 6 convidados
      });
    }
    return generatedTables;
  }, [tableCount, tableNames]);

  // Persist values to localStorage
  const saveGuestsToStorage = (updatedGuests: Guest[]) => {
    setGuests(updatedGuests);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_guests', JSON.stringify(updatedGuests));
    }
  };

  const handleUpdateTableCount = (count: number) => {
    setTableCount(count);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_table_count', count.toString());
    }
  };

  // Guest RSVP input states - dynamically initialized from logged in user if available
  const [rsvpName, setRsvpName] = useState(() => (user && user.role === 'GUEST' ? user.name : ''));
  const [rsvpSide, setRsvpSide] = useState<'Bride' | 'Groom'>(() => (user && user.role === 'GUEST' ? (user.side as any || 'Bride') : 'Bride'));
  const [rsvpPhone, setRsvpPhone] = useState(() => (user && user.role === 'GUEST' ? user.phone : ''));
  const [rsvpDiet, setRsvpDiet] = useState(() => (user && user.role === 'GUEST' ? (user.diet || 'Nenhuma') : 'Nenhuma'));
  const [rsvpDietDetails, setRsvpDietDetails] = useState(() => (user && user.role === 'GUEST' ? (user.dietDetails || '') : ''));
  const [rsvpMusic, setRsvpMusic] = useState(() => (user && user.role === 'GUEST' ? (user.musicRequest || '') : ''));
  const [rsvpAccommodation, setRsvpAccommodation] = useState<'Yes' | 'No'>(() => (user && user.role === 'GUEST' ? (user.needsAccommodation as any || 'No') : 'No'));
  const [rsvpAccommodationDetails, setRsvpAccommodationDetails] = useState(() => (user && user.role === 'GUEST' ? (user.accommodationDetails || '') : ''));
  const [rsvpSubmitted, setRsvpSubmitted] = useState(() => (user && user.role === 'GUEST' && (user.diet !== 'Nenhuma' || user.musicRequest || user.needsAccommodation === 'Yes' || user.checkIn) ? true : false));

  // Manager dashboard states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);

  // QR Code Scanner states
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const html5QrCodeRef = useRef<any>(null);

  // Widget Guide Modal state
  const [showWidgetModal, setShowWidgetModal] = useState(false);

  // Handle manual add guest from modal
  const handleAddGuestFromModal = async (guestData: {
    name: string;
    phone: string;
    side: 'Bride' | 'Groom';
    diet: string;
    dietDetails: string;
    music: string;
    accommodation: 'Yes' | 'No';
    accommodationDetails: string;
  }) => {
    const payload = {
      name: guestData.name,
      phone: guestData.phone,
      side: guestData.side,
      diet: guestData.diet,
      dietDetails: guestData.dietDetails,
      musicRequest: guestData.music,
      needsAccommodation: guestData.accommodation,
      accommodationDetails: guestData.accommodationDetails,
    };

    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGuests(prev => [data.guest, ...prev]);
          setShowAddGuestModal(false);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao adicionar convidado');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao adicionar convidado');
    }
  };

  // QR Code scan success handler
  const handleScanSuccess = async (decodedText: string) => {
    setScannerLoading(true);
    setScanResult(decodedText);
    setScanMessage(null);

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: decodedText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setScanMessage(data.message);
          // Update local guests list check-in status
          setGuests(prev => prev.map(g => (g.id === decodedText ? { ...g, checkIn: true } : g)));
        } else {
          setScanMessage(data.message || 'Convidado não localizado.');
        }
      } else {
        setScanMessage('Erro ao verificar convite no servidor.');
      }
    } catch (err) {
      console.error(err);
      setScanMessage('Erro de conexão ao ler o QR Code.');
    } finally {
      setScannerLoading(false);
    }
  };

  // QR Scanner Effect
  useEffect(() => {
    if (showScannerModal) {
      // Import html5-qrcode dynamically since it uses browser window/navigator
      import('html5-qrcode').then((module) => {
        const Html5Qrcode = module.Html5Qrcode;
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            html5QrCode.stop().catch(err => console.error(err));
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Normal scanning frame check failure
          }
        ).catch(err => {
          console.error('Failed to start scanner', err);
        });
      });
    }

    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch((err: any) => console.error(err));
        }
      }
    };
  }, [showScannerModal]);

  // Honeymoon Registry Checkout Simulation
  const [selectedGift, setSelectedGift] = useState<{ name: string; value: string; icon: string } | null>(null);
  const [giftContributorName, setGiftContributorName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftCheckoutSuccess, setGiftCheckoutSuccess] = useState(false);

  // Chatbot Assistant States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual do casamento de Lumiana e Vicente. 💖 Estou aqui para ajudar com qualquer dúvida sobre localização, trajes, presentes, hotel ou horários do grande dia. Como posso te ajudar hoje?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States for customizing photos via Drag-and-Drop / Click upload
  const [heroPhoto, setHeroPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_hero_photo');
      if (saved) return saved;
    }
    return "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200";
  });

  const [storyPhoto, setStoryPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_story_photo');
      if (saved) return saved;
    }
    return "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600";
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Timer Countdown Logic
  useEffect(() => {
    const targetDate = new Date('2026-08-29T12:00:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);



  // Handle querying wedding Gemini chatbot route
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim()) return;

    const updatedMessages = [
      ...chatMessages,
      { role: 'user' as const, content: promptToSend.trim() }
    ];
    
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor');
      }

      const data = await response.json();
      data.text = data.message || 'Nenhuma mensagem recebida';
      
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.text }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Ops, tive um pequeno problema ao me conectar com minha base de dados de noivado. Verifique se o sinal está bom ou pergunte de novo!' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Simulated preset prompts for the wedding assistant
  const PRESET_QUESTION_CHIPS = [
    { label: '📍 Onde e quando?', text: 'Qual é a data, horário e endereço do casamento?' },
    { label: '👗 Qual o traje?', text: 'Qual é o estilo de traje (dress code) recomendado?' },
    { label: '🎁 Lista de Presentes', text: 'Como funciona a lista de presentes e as cotas?' },
    { label: '🏨 Indicação de Hotel', text: 'Onde posso me hospedar perto do evento?' }
  ];

  // Honeymoon simulation list
  const COTAS_LUA_DE_MEL = [
    { id: 'c-1', name: 'Jantar Romântico aos pés da Torre Eiffel', value: 'R$ 350', icon: '🗼' },
    { id: 'c-2', name: 'Bilhetes para o Museu do Louvre', value: 'R$ 180', icon: '🎟️' },
    { id: 'c-3', name: 'Passeio com espumante no Rio Sena', value: 'R$ 250', icon: '⛵' },
    { id: 'c-4', name: 'Café da manhã parisiense em bistrô clássico', value: 'R$ 100', icon: '☕' },
    { id: 'c-5', name: 'Hospedagem em charmoso hotel boutique', value: 'R$ 500', icon: '🏨' },
    { id: 'c-6', name: 'Compra de queijos e vinhos em Bordeaux', value: 'R$ 150', icon: '🍷' }
  ];

  // RSVP Submit - updates or creates a guest entry via the API
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !rsvpPhone.trim()) return;

    const payload = {
      name: rsvpName.trim(),
      phone: rsvpPhone.trim(),
      side: rsvpSide,
      diet: rsvpDiet,
      dietDetails: rsvpDietDetails.trim(),
      musicRequest: rsvpMusic.trim(),
      needsAccommodation: rsvpAccommodation,
      accommodationDetails: rsvpAccommodationDetails.trim(),
    };

    try {
      // If user is already logged in as a guest, update their record
      if (user && user.role === 'GUEST') {
        const res = await fetch('/api/guests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, ...payload }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setGuests(prev => prev.map(g => g.id === user.id ? data.guest : g));
            setRsvpSubmitted(true);
          }
        } else {
          alert('Erro ao atualizar confirmação. Tente novamente.');
        }
      } else {
        // New guest submitting RSVP
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setGuests(prev => [data.guest, ...prev]);
            setRsvpSubmitted(true);
          } else {
            alert(data.error || 'Erro ao confirmar presença.');
          }
        } else {
          const err = await res.json();
          alert(err.error || 'Erro ao enviar RSVP.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
  };

  // Delete a guest via API then update local state
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Tem certeza que deseja remover este convidado?')) return;
    try {
      const res = await fetch(`/api/guests?id=${guestId}`, { method: 'DELETE' });
      if (res.ok) {
        setGuests(prev => prev.filter(g => g.id !== guestId));
      } else {
        alert('Erro ao remover convidado.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao remover convidado.');
    }
  };

  // Assign (or unassign) a guest to a table via API
  const assignGuestToTable = async (guestId: string, tableId: number | null) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guestId, tableId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGuests(prev => prev.map(g => g.id === guestId ? { ...g, tableId } : g));
        }
      } else {
        alert('Erro ao atualizar assento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao atualizar assento.');
    }
  };

  // Auto-allocate all unassigned guests evenly across available tables
  const handleAutoAllocate = async () => {
    const unassigned = guests.filter(g => g.tableId === null);
    if (unassigned.length === 0) {
      alert('Todos os convidados já foram alocados!');
      return;
    }

    const updatedGuests = [...guests];
    let guestIndex = 0;

    for (const table of tables) {
      const currentCount = updatedGuests.filter(g => g.tableId === table.id).length;
      const available = 6 - currentCount;
      for (let i = 0; i < available && guestIndex < unassigned.length; i++, guestIndex++) {
        const guest = unassigned[guestIndex];
        try {
          await fetch('/api/guests', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: guest.id, tableId: table.id }),
          });
          const idx = updatedGuests.findIndex(g => g.id === guest.id);
          if (idx !== -1) updatedGuests[idx] = { ...updatedGuests[idx], tableId: table.id };
        } catch (err) {
          console.error('Auto-allocate error for guest', guest.id, err);
        }
      }
      if (guestIndex >= unassigned.length) break;
    }

    setGuests(updatedGuests);
    if (guestIndex < unassigned.length) {
      alert(`Alocação concluída! ${unassigned.length - guestIndex} convidados não puderam ser alocados por falta de espaço. Aumente o número de mesas.`);
    }
  };

  // Reset all data (clears localStorage and re-fetches from DB)
  const handleResetData = async () => {
    if (!confirm('Tem certeza que deseja resetar o painel? Isso vai limpar o localStorage e recarregar os dados.')) return;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wedding_guests');
      localStorage.removeItem('wedding_table_count');
      localStorage.removeItem('wedding_table_names');
    }
    try {
      const res = await fetch('/api/guests');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setGuests(data.guests);
      }
    } catch (err) {
      console.error(err);
    }
    setTableCount(6);
    setTableNames({});
  };

  // CSV Exporter — usa a lib melhorada com BOM UTF-8 e separador ponto-e-vírgula
  const handleExportCSV = () => generateCSV(guests);

  // PDF Exporter — documento estruturado e profissional
  const handleExportPDF = () => generateWeddingPDF(guests, tables, tableNames);

  // Filter guest list
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.musicRequest.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSide = filterSide === 'All' ? true : g.side === filterSide;

    return matchesSearch && matchesSide;
  });

  // Calculate statistics
  const totalRsvp = guests.length;
  const brideFamilyCount = guests.filter(g => g.side === 'Bride').length;
  const groomFamilyCount = guests.filter(g => g.side === 'Groom').length;
  const totalAllocated = guests.filter(g => g.tableId !== null).length;

  return (
    <div className="min-h-screen flex flex-col relative" id="wedding-app-root">
      
      {/* Elegante Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-xs border-b border-stone-100" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-0 sm:h-20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-wedding-burgundy animate-pulse shrink-0" />
            <span className="font-serif text-[19px] min-[360px]:text-xl sm:text-2xl font-semibold tracking-wide text-wedding-navy whitespace-nowrap">
              Lumiana <span className="text-wedding-gold font-light">&</span> Vicente
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-500 font-medium hidden sm:block">
                Olá, {user.name.split(' ')[0]}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Lock className="w-3 h-3" /> Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Primary Body Content Grid */}
      <main className="flex-1 bg-[#FDFCFB]">
        <AnimatePresence mode="wait" initial={false}>
          
          {(!user || user.role === 'GUEST') && (
            <motion.div
              key="guest-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
              id="guest-tab-container"
            >
              
              {/* PRIMARY RESPONSIVE BENTO GRID COLLAGE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* 1. HERO MAIN CELEBRATION BENTO BLOCK (col-span-8) */}
                <div id="card-hero" className="lg:col-span-8 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-xs min-h-[480px]">
                  {/* Decorative background image overlay */}
                  <div className="absolute inset-0 z-0">
                    {heroPhoto.startsWith('data:') ? (
                      <img 
                        src={heroPhoto} 
                        alt="Cenário de Casamento Capela da Polana" 
                        className="w-full h-full object-cover filter brightness-[0.35] contrast-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Image 
                        src={heroPhoto} 
                        alt="Cenário de Casamento Capela da Polana" 
                        fill
                        className="w-full h-full object-cover filter brightness-[0.35] contrast-105 animate-[fadeIn_1.5s_ease-out]"
                        referrerPolicy="no-referrer"
                        priority
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001B3D]/95 via-[#001B3D]/40 to-transparent"></div>
                  </div>

                  {/* Absolute top-right corner romantic accent overlay from Bento parameters */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#800020]/10 rounded-bl-full z-10 pointer-events-none"></div>

                  {/* Quick-customization trigger button */}
                  <div className="absolute top-4 left-4 z-20">
                    <button
                      id="btn-upload-photos-quick"
                      onClick={() => setShowPhotoModal(true)}
                      className="bg-white/90 hover:bg-white text-[#001B3D] text-[10px] font-bold tracking-wider uppercase px-3 py-2 rounded-xl backdrop-blur transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.03]"
                    >
                      <span>📷 Personalizar Fotos</span>
                    </button>
                  </div>

                  <div className="z-10 text-white mt-auto md:mt-0">
                    <span className="text-[#C5A880] uppercase tracking-[0.35em] font-semibold text-xs border-b border-[#C5A880]/40 pb-1 inline-block">
                      A Celebração de
                    </span>
                    <h1 className="text-4xl md:text-7xl font-serif mt-6 text-white leading-tight">
                      Lumiana & Vicente
                    </h1>
                    <p className="text-sm md:text-base mt-4 text-stone-200 font-serif italic max-w-lg">
                      Duas almas, um só coração e um caminho de cumplicidade que se inicia para toda a eternidade.
                    </p>
                  </div>

                  <div className="z-10 flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-white/10 text-white">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">Data</span>
                      <span className="text-base md:text-lg font-serif">29 de Agosto de 2026</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">Local</span>
                      <span className="text-base md:text-lg font-serif">Capela da Polana, Maputo</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">Horário</span>
                      <span className="text-base md:text-lg font-serif">12:00 Horas</span>
                    </div>
                  </div>
                </div>

                {/* 2. REGISTRATION COUNTDOWN / CHRONOMETER BENTO BLOCK (col-span-4) */}
                <div id="card-countdown" className="lg:col-span-4 bg-[#001B3D] rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-xs relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-serif italic tracking-wide text-[#C5A880]">Cronômetro Especial</h2>
                      <span className="bg-[#800020] text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-bold">Save the Date</span>
                    </div>

                    <p className="text-stone-300 text-xs mb-6">Aguardando ansiosamente com contagem regressiva para o nosso grande dia:</p>

                    {/* Countdown columns */}
                    <div className="grid grid-cols-4 gap-1.5 text-center mb-8">
                      <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="text-lg md:text-xl font-serif text-[#C5A880] block font-semibold">{timeLeft.days}</span>
                        <span className="text-[8px] uppercase tracking-wider text-stone-300 block">Dias</span>
                      </div>
                      <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="text-lg md:text-xl font-serif text-[#C5A880] block font-semibold">{timeLeft.hours}</span>
                        <span className="text-[8px] uppercase tracking-wider text-stone-300 block">Horas</span>
                      </div>
                      <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="text-lg md:text-xl font-serif text-[#C5A880] block font-semibold">{timeLeft.minutes}</span>
                        <span className="text-[8px] uppercase tracking-wider text-stone-300 block">Min</span>
                      </div>
                      <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="text-lg md:text-xl font-serif text-[#C5A880] block font-semibold">{timeLeft.seconds}</span>
                        <span className="text-[8px] uppercase tracking-wider text-stone-300 block">Seg</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <a 
                      href="#rsvp-box-anchor"
                      className="w-full py-3.5 bg-[#800020] hover:bg-[#800020]/90 text-white rounded-xl text-[11px] font-semibold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer text-center"
                    >
                      Confirmar Presença
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 3. OUR LOVE STORY BENTO BLOCK (col-span-8) */}
                <div id="card-love-story" className="lg:col-span-8 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
                  <div>
                    <span className="text-[#800020] uppercase tracking-[0.25em] font-semibold text-[9px] border-b border-[#800020]/20 pb-1 inline-block mb-4">
                      Nossa História de Amor
                    </span>
                    <h3 className="font-serif text-3xl text-[#001B3D] mb-6 font-normal">
                      O Começo da Nossa Eternidade
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-5 relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-xs">
                        {storyPhoto.startsWith('data:') ? (
                          <img 
                            src={storyPhoto} 
                            alt="Casal Lumiana e Vicente" 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-[4000ms]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Image 
                            src={storyPhoto} 
                            alt="Casal Lumiana e Vicente" 
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-[4000ms]"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="md:col-span-7 text-xs text-stone-600 space-y-3 leading-relaxed">
                        <p>
                          O que começou com um propósito compartilhado tornou-se amizade, amor e a certeza de que fomos feitos para caminhar juntos.
                        </p>
                        <p className="font-serif italic text-[#800020] border-l-2 border-[#C5A880] pl-3 py-1.5 font-medium mt-2 text-[11px] leading-normal">
                          &ldquo;O casamento é, na verdade, uma parceria de iguais, trabalhando juntos para alcançar um objetivo comum.&rdquo;<br />
                          <span className="text-[10px] text-stone-500 font-sans not-italic block mt-1">— Presidente Gordon B. Hinckley</span>
                        </p>
                        <p>
                          Hoje iniciamos essa parceria eterna, edificada sobre fé, serviço e amor.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. GUIDES & UTILITIES INFO BENTO BLOCK (col-span-4) */}
                <div id="card-event-details" className="lg:col-span-4 bg-[#FDFCFB] border border-[#001B3D]/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden text-[#001B3D]">
                  <div>
                    <span className="text-[#800020] uppercase tracking-[0.25em] font-semibold text-[9px] border-b border-[#800020]/20 pb-1 inline-block mb-4">
                      Guia do Convidado
                    </span>
                    <h3 className="font-serif text-2xl text-[#001B3D] mb-6 font-normal">Onde & Quando</h3>

                    <div className="space-y-4">
                      {/* Local */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#001B3D]/5 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-[#800020]" />
                        </div>
                        <div>
                          <strong className="text-xs text-[#001B3D] block font-serif">Capela da Polana</strong>
                          <span className="text-[10px] text-stone-600 block leading-tight">Avenida Julius Nyerere, Polana Cimento • Cidade de Maputo</span>
                          <button 
                            onClick={() => alert('Waze/Google Maps: Rota sugerida para a Capela da Polana carregada no seu dispositivo.')}
                            className="text-[9px] font-bold text-[#800020] uppercase mt-0.5 tracking-wider hover:underline"
                          >
                            Abrir Rota GPS →
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 7. ATTENDANCE CONFIRMATION RSVP FORM CARD (col-span-8) */}
                <div id="rsvp-box-anchor" className="lg:col-span-8 bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-10 flex flex-col shadow-xs relative overflow-hidden text-[#001B3D]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#800020]/5 rounded-bl-full pointer-events-none"></div>

                  <h3 className="font-serif text-3xl font-semibold text-[#001B3D] mb-6 text-left">Confirmar a presença</h3>

                  {rsvpSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col gap-5"
                    >
                      {/* Confirmation banner */}
                      <div className="bg-stone-50 border border-[#001B3D]/10 p-6 rounded-2xl text-center">
                        <div className="w-12 h-12 bg-[#800020] text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                          <Check className="w-6 h-6" />
                        </div>
                        <h4 className="font-serif text-xl font-semibold text-[#001B3D] mb-2">Presença Confirmada!</h4>
                        <p className="text-stone-600 text-xs leading-relaxed mb-4">
                          Muito obrigado por confirmar sua presença. Seus dados foram encaminhados ao nosso time cerimonial.
                        </p>

                        {/* Mini Countdown Widget */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3 my-6">
                          <div className="flex flex-col items-center bg-white border border-[#001B3D]/10 rounded-xl p-3 w-16 sm:w-20 shadow-xs">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-[#800020]">{String(timeLeft.days).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Dias</span>
                          </div>
                          <div className="text-stone-300 font-serif text-xl">:</div>
                          <div className="flex flex-col items-center bg-white border border-[#001B3D]/10 rounded-xl p-3 w-16 sm:w-20 shadow-xs">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-[#800020]">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Horas</span>
                          </div>
                          <div className="text-stone-300 font-serif text-xl">:</div>
                          <div className="flex flex-col items-center bg-white border border-[#001B3D]/10 rounded-xl p-3 w-16 sm:w-20 shadow-xs">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-[#800020]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Min</span>
                          </div>
                          <div className="text-stone-300 font-serif text-xl hidden sm:block">:</div>
                          <div className="hidden sm:flex flex-col items-center bg-white border border-[#001B3D]/10 rounded-xl p-3 w-16 sm:w-20 shadow-xs">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-[#800020]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Seg</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-stone-200 mb-4">
                          <QRCodeSVG value={user?.id || 'guest-qr'} size={140} level="H" includeMargin={true} />
                          <p className="text-[#001B3D] text-sm mt-3 font-medium">Seu QR Code de Entrada</p>
                          <p className="text-stone-400 text-xs">Apresente este código na recepção do evento.</p>
                        </div>
                        <button 
                          onClick={() => setRsvpSubmitted(false)}
                          className="text-xs font-semibold text-[#800020] hover:underline cursor-pointer"
                        >
                          Confirmar outra pessoa →
                        </button>
                      </div>

                      {/* ── MUSIC REQUEST WIDGET — sempre visível ── */}
                      <MusicRequestWidget
                        currentMusic={rsvpMusic}
                        userId={user?.id}
                        userName={user?.name}
                        onMusicSaved={(m) => setRsvpMusic(m)}
                      />
                    </motion.div>
                  ) : (

                    <form onSubmit={handleRsvpSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-left">
                      
                      {/* Name input */}
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-[#001B3D]/60" htmlFor="guest-full-name">
                          Nome Completo *
                        </label>
                        <input 
                          type="text"
                          required
                          id="guest-full-name"
                          value={rsvpName}
                          onChange={(e) => setRsvpName(e.target.value)}
                          placeholder="Digite seu nome completo..."
                          className="border-b border-[#001B3D]/20 py-2 focus:border-[#800020] focus:outline-none text-sm placeholder:italic text-stone-855 font-medium bg-transparent"
                        />
                      </div>

                      {/* Phone/Contact number input */}
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-[#001B3D]/60" htmlFor="guest-phone">
                          Nº de Celular (Moçambique) *
                        </label>
                        <input 
                          type="tel"
                          required
                          id="guest-phone"
                          value={rsvpPhone}
                          onChange={(e) => setRsvpPhone(e.target.value)}
                          placeholder="Ex: +258 84 123 4567"
                          pattern="^\+258[0-9\s-]{9,15}$"
                          title="Número de celular de Moçambique que começa com +258 e possui 9 dígitos."
                          className="border-b border-[#001B3D]/20 py-2 focus:border-[#800020] focus:outline-none text-sm placeholder:italic text-stone-855 font-medium bg-transparent"
                        />
                      </div>

                      {/* Side of the family button grid mapping */}
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-[#001B3D]/60">
                          Lado do Evento *
                        </label>
                        <select 
                          value={rsvpSide}
                          onChange={(e) => setRsvpSide(e.target.value as any)}
                          className="border-b border-[#001B3D]/20 py-2 bg-transparent text-sm focus:outline-none focus:border-[#800020] text-stone-800 font-medium cursor-pointer"
                        >
                          <option value="Bride">Família da Noiva (Lumiana)</option>
                          <option value="Groom">Família do Noivo (Vicente)</option>
                        </select>
                      </div>

                      {/* Song Request input container */}
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-[#001B3D]/60" htmlFor="music-request-field">
                          Pedido de Música
                        </label>
                        <input 
                          type="text"
                          id="music-request-field"
                          value={rsvpMusic}
                          onChange={(e) => setRsvpMusic(e.target.value)}
                          placeholder="Música / Banda desejada"
                          className="border-b border-[#001B3D]/20 py-2 focus:outline-none text-sm placeholder:italic bg-transparent text-stone-855 font-medium"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2 pt-4">
                        <button 
                          type="submit" 
                          className="w-full bg-[#001B3D] hover:bg-[#001B3D]/95 text-white py-4 rounded-xl font-serif text-base italic transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-2"
                        >
                          Confirmar Presença
                        </button>
                      </div>

                    </form>
                  )}
                </div>

                {/* 8. BRIDE AND GROOM INTENSE ROMANCE HERO CARD (col-span-4) */}
                <div id="card-romance-footer" className="lg:col-span-4 bg-gradient-to-br from-[#800020] to-[#500312] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full pointer-events-none"></div>

                  <div>
                    <h4 className="font-serif italic text-lg text-[#C5A880] mb-4">“Duas vidas, um caminho compartilhado”</h4>
                    <p className="text-stone-200 text-[11px] leading-relaxed">
                      Sua presença é o maior presente que poderíamos desejar. Queremos comemorar este início da nossa eternidade ao lado de todos aqueles que amamos e fazem parte da nossa história.
                    </p>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-[#C5A880] fill-[#C5A880] animate-pulse shrink-0" />
                    <div>
                       <span className="text-[9px] uppercase tracking-wider text-stone-300 block font-semibold leading-none mb-1">Com todo carinho,</span>
                      <span className="font-serif text-base text-white">Lumiana e Vicente</span>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {user && user.role === 'STAFF' && (
            <StaffDashboard
              guests={guests}
              tables={tables}
              tableNames={tableNames}
              tableCount={tableCount}
              onSetTableCount={(n) => {
                setTableCount(n);
                if (typeof window !== 'undefined') localStorage.setItem('wedding_table_count', n.toString());
              }}
              onAssignGuest={assignGuestToTable}
              onAutoAllocate={handleAutoAllocate}
              onResetData={handleResetData}
              onDeleteGuest={handleDeleteGuest}
              onAddGuest={() => setShowAddGuestModal(true)}
              onAssignTableFromGuest={assignGuestToTable}
              onSaveTableName={saveTableNamesToStorage}
              onLogout={onLogout ?? (() => {})}
            />
          )}

        </AnimatePresence>

        {/* Add Guest Modal */}
        <AddGuestModal
          isOpen={showAddGuestModal}
          onClose={() => setShowAddGuestModal(false)}
          onAddGuest={handleAddGuestFromModal}
        />
      </main>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-400 py-12 border-t border-stone-850" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-6 h-6 text-wedding-burgundy mx-auto mb-4 animate-pulse fill-wedding-burgundy" />
          <h4 className="font-serif text-xl text-white tracking-widest mb-1.5">Lumiana & Vicente</h4>
          <p className="text-stone-500 text-xs mb-6 uppercase tracking-wider">Maputo | 29 de Agosto de 2026</p>
          <div className="w-16 h-0.5 bg-wedding-gold/40 mx-auto mb-6"></div>
          <p className="text-xs text-stone-600">
            © 2026 Lumiana & Vicente Wedding Day. Desenvolvido com muito romance e sofisticação para marcar o começo da eternidade.
          </p>
        </div>
      </footer>

      {/* PHOTO UPLOAD MODAL */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="modal-photo-upload">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-stone-100 text-stone-900 overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 flex items-center gap-2">
                <Camera className="w-5 h-5 text-wedding-burgundy animate-pulse" />
                <div>
                  <h3 className="font-serif text-xl font-semibold text-wedding-navy mb-0.5">Personalizar Fotos de Lumiana e Vicente</h3>
                  <p className="text-stone-550 text-[10px]">Arraste uma imagem ou clique para selecionar fotos para personalizar o banner ou história.</p>
                </div>
              </div>

              <div className="space-y-6">
                
                {/* 1. HERO PHOTO ZONE */}
                <div className="border-t border-stone-100 pt-4">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2 block text-left">Foto de Entrada (Banner Principal)</span>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-50">
                      {heroPhoto.startsWith('data:') ? (
                        <img 
                          src={heroPhoto} 
                          alt="Visualização da foto principal" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Image 
                          src={heroPhoto} 
                          alt="Visualização da foto principal" 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Drag and Drop Zone */}
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setHeroPhoto(reader.result);
                              localStorage.setItem('wedding_hero_photo', reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => {
                        document.getElementById('input-hero-photo-upload')?.click();
                      }}
                      className="flex-grow border-2 border-dashed border-stone-200 hover:border-wedding-burgundy hover:bg-[#800020]/5 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 w-full"
                    >
                      <Upload className="w-4 h-4 mx-auto text-stone-400 mb-1" />
                      <p className="text-[10px] font-medium text-stone-600">Arraste a foto principal aqui, ou clique para selecionar</p>
                      <p className="text-[8px] text-stone-400 mt-0.5">PNG, JPG ou WebP de qualquer tamanho</p>
                      <input 
                        type="file" 
                        id="input-hero-photo-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setHeroPhoto(reader.result);
                                localStorage.setItem('wedding_hero_photo', reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {heroPhoto !== "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" && (
                    <button 
                      onClick={() => {
                        setHeroPhoto("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200");
                        localStorage.removeItem('wedding_hero_photo');
                      }}
                      className="text-[9px] font-bold text-[#800020] uppercase mt-2 hover:underline block cursor-pointer"
                    >
                      Resetar para Foto Padrão
                    </button>
                  )}
                </div>

                {/* 2. STORY PHOTO ZONE */}
                <div className="border-t border-stone-100 pt-4">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2 block text-left">Foto da Nossa História</span>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-50">
                      {storyPhoto.startsWith('data:') ? (
                        <img 
                          src={storyPhoto} 
                          alt="Visualização da foto da história" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Image 
                          src={storyPhoto} 
                          alt="Visualização da foto da história" 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Drag and Drop Zone */}
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setStoryPhoto(reader.result);
                              localStorage.setItem('wedding_story_photo', reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => {
                        document.getElementById('input-story-photo-upload')?.click();
                      }}
                      className="flex-grow border-2 border-dashed border-stone-200 hover:border-wedding-burgundy hover:bg-[#800020]/5 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 w-full"
                    >
                      <Upload className="w-4 h-4 mx-auto text-stone-400 mb-1" />
                      <p className="text-[10px] font-medium text-stone-600">Arraste a foto da história aqui, ou clique para selecionar</p>
                      <p className="text-[8px] text-stone-400 mt-0.5">PNG, JPG ou WebP de qualquer tamanho</p>
                      <input 
                        type="file" 
                        id="input-story-photo-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setStoryPhoto(reader.result);
                                localStorage.setItem('wedding_story_photo', reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {storyPhoto !== "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600" && (
                    <button 
                      onClick={() => {
                        setStoryPhoto("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600");
                        localStorage.removeItem('wedding_story_photo');
                      }}
                      className="text-[9px] font-bold text-[#800020] uppercase mt-2 hover:underline block cursor-pointer"
                    >
                      Resetar para Foto Padrão
                    </button>
                  )}
                </div>

              </div>

              <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="px-6 py-2.5 bg-[#001B3D] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md cursor-pointer transition-colors"
                >
                  Concluir
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHATBOT FLOATING CHIP BAR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="chatbot-assistant-main">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.92 }}
              className="bg-white rounded-3xl w-[350px] sm:w-[420px] h-[550px] shadow-2xl border border-stone-150 flex flex-col overflow-hidden text-stone-900"
            >
              {/* Chat Header */}
              <div className="bg-[#001B3D] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-wedding-gold animate-pulse fill-wedding-gold" />
                  <div>
                    <h3 className="font-serif text-sm font-semibold tracking-wide">Assistente de Casamento</h3>
                    <p className="text-[10px] text-stone-300">Respostas automáticas para convidados</p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FDFCFB]/70 selection:bg-[#800020]/10">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#800020] text-white rounded-br-none shadow-sm'
                          : 'bg-stone-100 text-[#001B3D] rounded-bl-none border border-stone-200/50'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 rounded-bl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#800020]/60 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#800020]/80 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-[#800020] rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Preset Questions */}
              <div className="px-4 py-2 bg-stone-50/50 border-t border-stone-100 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {PRESET_QUESTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, chip.text)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-stone-200 hover:border-[#800020] hover:text-[#800020] rounded-full text-[10px] font-medium text-stone-600 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-stone-100 flex items-center gap-2 bg-white shrink-0"
              >
                <input
                  type="text"
                  placeholder="Pergunte sobre trajes, horários, hotéis..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#800020] text-stone-800"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-10 h-10 rounded-xl bg-[#001B3D] hover:bg-[#800020] disabled:bg-stone-100 disabled:text-stone-300 text-white flex items-center justify-center transition-all cursor-pointer border border-transparent"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating circular opener button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 bg-[#800020] hover:bg-[#500312] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer z-50 border border-white/10"
          title="Falar com o Cerimonial"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
        </button>
      </div>

    </div>
  );
}
