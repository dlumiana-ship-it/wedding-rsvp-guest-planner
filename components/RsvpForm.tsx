'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, Trash2, Check, X, Send, Sparkles, AlertCircle, Utensils, Music, MapPin } from 'lucide-react';

interface CompanionInput {
  name: string;
  diet: string;
  dietDetails: string;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  side: 'Bride' | 'Groom';
  status: string;
  musicRequest?: string | null;
  needsAccommodation: string;
  accommodationDetails?: string | null;
  rsvpMessage?: string | null;
  giftDeliveryMethod?: string | null;
}

interface RsvpFormProps {
  guest: Guest;
  onRsvpSubmitted: (updatedGuest: any) => void;
}



export default function RsvpForm({ guest, onRsvpSubmitted }: RsvpFormProps) {
  const [isAttending, setIsAttending] = useState<boolean | null>(
    guest.status === 'CONFIRMED' ? true : guest.status === 'DECLINED' ? false : null
  );
  
  // Form values
  const [needsAccommodation, setNeedsAccommodation] = useState(guest.needsAccommodation || 'Não');
  const [accommodationDetails, setAccommodationDetails] = useState(guest.accommodationDetails || '');
  const [rsvpMessage, setRsvpMessage] = useState(guest.rsvpMessage || '');
  const [giftDeliveryMethod, setGiftDeliveryMethod] = useState(guest.giftDeliveryMethod || 'Ainda não decidi');
  
  // Music request fields
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songJustification, setSongJustification] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending === null || loading) return;

    setLoading(true);
    setError('');

    // Combine song information if requested
    let combinedMusic = guest.musicRequest || '';
    if (songTitle.trim()) {
      const songDetails = songArtist.trim() 
        ? `${songTitle.trim()} - ${songArtist.trim()}` 
        : songTitle.trim();
      combinedMusic = guest.musicRequest 
        ? `${guest.musicRequest} | ${songDetails}`
        : songDetails;
    }

    const payload = {
      id: guest.id,
      status: isAttending ? 'CONFIRMED' : 'DECLINED',
      needsAccommodation: isAttending ? needsAccommodation : 'Não',
      accommodationDetails: isAttending && needsAccommodation === 'Sim' ? accommodationDetails.trim() : null,
      musicRequest: isAttending ? combinedMusic : null,
      rsvpMessage: rsvpMessage.trim() || null,
      giftDeliveryMethod: isAttending ? giftDeliveryMethod : 'Não especificado',
    };

    try {
      const res = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // If a new song was requested, save it to the Songs table too!
        if (isAttending && songTitle.trim()) {
          await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: songTitle,
              artist: songArtist || 'Desconhecido',
              requestedBy: guest.name,
              justification: songJustification || null,
              category: 'recepcao',
            }),
          });
        }

        // Also add the RSVP message to the Digital Wall automatically
        if (rsvpMessage.trim()) {
          await fetch('/api/wall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guestName: guest.name,
              guestId: guest.id,
              content: rsvpMessage,
            }),
          });
        }

        setSuccess(true);
        setTimeout(() => {
          onRsvpSubmitted(data.guest);
        }, 3000);
      } else {
        setError(data.error || 'Ocorreu um erro ao gravar a sua resposta.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (guest.status === 'CONFIRMED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-wedding-gold/20 p-8 md:p-12 text-center flex flex-col items-center shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-wedding-gold rounded-full animate-ping" />
          <div className="absolute bottom-10 right-10 w-3 h-3 bg-wedding-burgundy rounded-full animate-ping" />
        </div>

        <motion.div
          initial={{ rotate: -15, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 bg-wedding-burgundy text-white rounded-full flex items-center justify-center mb-6 shadow-md"
        >
          <Heart className="w-8 h-8 fill-current animate-pulse" />
        </motion.div>

        <h3 className="font-serif text-2xl md:text-3xl text-[#001B3D] mb-4 font-normal">
          Presença já Confirmada!
        </h3>
        <p className="text-stone-600 text-sm md:text-base max-w-md leading-relaxed">
          A sua presença já se encontra confirmada no nosso sistema. Muito obrigado por fazer parte deste momento tão especial!
        </p>

        <div className="w-20 h-0.5 bg-wedding-gold/30 my-6" />
        <p className="text-xs text-stone-400 animate-pulse">A aceder à sua área reservada...</p>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-wedding-gold/20 p-8 md:p-12 text-center flex flex-col items-center shadow-lg relative overflow-hidden"
      >
        {/* Sparkles backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-wedding-gold rounded-full animate-ping" />
          <div className="absolute bottom-10 right-10 w-3 h-3 bg-wedding-burgundy rounded-full animate-ping" />
        </div>

        <motion.div
          initial={{ rotate: -15, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 bg-wedding-burgundy text-white rounded-full flex items-center justify-center mb-6 shadow-md"
        >
          <Heart className="w-8 h-8 fill-current animate-pulse" />
        </motion.div>

        {isAttending ? (
          <>
            <h3 className="font-serif text-2xl md:text-3xl text-wedding-navy mb-4 font-normal">
              Que alegria!
            </h3>
            <p className="text-stone-600 text-sm md:text-base max-w-md leading-relaxed">
              Estamos ansiosos por celebrar consigo este dia mágico. A sua confirmação foi registada com carinho.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-serif text-2xl md:text-3xl text-wedding-navy mb-4 font-normal">
              Agradecemos muito
            </h3>
            <p className="text-stone-600 text-sm md:text-base max-w-md leading-relaxed">
              Ficamos tristes por não poder contar consigo, mas levamos o seu carinho no coração e desejamos ver-nos noutra ocasião em breve!
            </p>
          </>
        )}

        <div className="w-20 h-0.5 bg-wedding-gold/30 my-6" />
        <p className="text-xs text-stone-400 animate-pulse">A redirecionar para a sua área reservada...</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white border border-[#001B3D]/10 rounded-3xl p-6 md:p-10 shadow-xs text-stone-900" id="rsvp-card-flow">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-5 h-5 text-wedding-burgundy fill-wedding-burgundy" />
        <div>
          <h2 className="font-serif text-2xl text-wedding-navy">Confirmação de Presença</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-0.5">RSVP Digital</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-stone-600 text-sm mb-4">
          Por favor, indique se poderá comparecer ao casamento de Lumiana & Vicente no dia 12 de Setembro de 2026:
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setIsAttending(true)}
            className={`py-4 rounded-xl border text-sm font-serif italic font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isAttending === true
                ? 'bg-wedding-navy text-white border-wedding-navy shadow-md'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/50'
            }`}
          >
            <Check className={`w-4 h-4 ${isAttending === true ? 'opacity-100' : 'opacity-0'}`} />
            Sim, com alegria!
          </button>
          
          <button
            type="button"
            onClick={() => setIsAttending(false)}
            className={`py-4 rounded-xl border text-sm font-serif italic font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isAttending === false
                ? 'bg-wedding-burgundy text-white border-wedding-burgundy shadow-md'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/50'
            }`}
          >
            <X className={`w-4 h-4 ${isAttending === false ? 'opacity-100' : 'opacity-0'}`} />
            Infelizmente não poderei
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isAttending === true && (
          <motion.form
            key="attending-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6 overflow-hidden text-left"
          >
            {/* 1. GIFT DELIVERY METHOD */}
            <div className="border-t border-stone-100 pt-6 grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-wedding-navy flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-wedding-gold" />
                  Entrega do Presente
                </label>
                <p className="text-[11px] text-stone-500 mb-2">Para nos ajudar na organização, diga-nos a sua preferência.</p>
                <select
                  value={giftDeliveryMethod}
                  onChange={(e) => setGiftDeliveryMethod(e.target.value)}
                  className="border border-stone-200 rounded-xl p-3 bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-800"
                >
                  <option value="Ainda não decidi">Ainda não decidi</option>
                  <option value="Vou entregar na confirmação (via App)">Vou entregar agora pela plataforma / App</option>
                  <option value="Vou levar no dia do Evento (Cestão)">Vou levar fisicamente no dia do Evento (Cestão)</option>
                  <option value="Não irei oferecer presente">Não irei oferecer presente desta vez</option>
                </select>
              </div>
            </div>

            {/* 3. ACCOMMODATION NEEDS */}
            <div className="border-t border-stone-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-wedding-navy flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-wedding-gold" />
                  Necessita de Alojamento?
                </label>
                <select
                  value={needsAccommodation}
                  onChange={(e) => setNeedsAccommodation(e.target.value)}
                  className="border border-stone-200 rounded-xl p-3 bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-800"
                >
                  <option value="Não">Não necessito</option>
                  <option value="Sim">Sim, preciso de ajuda com estadia</option>
                </select>
              </div>

              {needsAccommodation === 'Sim' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-wedding-navy">
                    Detalhes do Alojamento
                  </label>
                  <input
                    type="text"
                    value={accommodationDetails}
                    onChange={(e) => setAccommodationDetails(e.target.value)}
                    placeholder="Quarto simples, duplo, familiar..."
                    className="border border-stone-200 rounded-xl p-3 bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                  />
                </div>
              )}
            </div>

            {/* 4. MUSIC REQUEST (WITH JUSTIFICATION) */}
            <div className="border-t border-stone-100 pt-6 space-y-4">
              <label className="text-xs uppercase tracking-wider font-bold text-wedding-navy flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-wedding-gold" />
                Deseja sugerir alguma música para a festa?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Título da Música</span>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Ex: Evidências"
                    className="border-b border-stone-200 py-2 focus:border-wedding-navy focus:outline-none text-xs text-stone-850 bg-transparent"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Artista / Banda</span>
                  <input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Ex: Chitãozinho & Xororó"
                    className="border-b border-stone-200 py-2 focus:border-wedding-navy focus:outline-none text-xs text-stone-850 bg-transparent"
                  />
                </div>
              </div>

              {songTitle.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-1.5"
                >
                  <label className="text-[10px] uppercase font-bold text-stone-400">
                    Porque é que esta música não pode faltar? (Justificativa)
                  </label>
                  <input
                    type="text"
                    value={songJustification}
                    onChange={(e) => setSongJustification(e.target.value)}
                    placeholder="Ex: Lembramo-nos da nossa viagem juntas / É a favorita do noivo!"
                    className="border-b border-stone-200 py-2 focus:border-wedding-navy focus:outline-none text-xs text-stone-850 bg-transparent"
                  />
                </motion.div>
              )}
            </div>

            {/* 5. MESSAGE TO BRIDE & GROOM */}
            <div className="border-t border-stone-100 pt-6 flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-wedding-navy flex items-center gap-1.5">
                Deixe uma mensagem de carinho aos noivos 💬
              </label>
              <textarea
                rows={3}
                value={rsvpMessage}
                onChange={(e) => setRsvpMessage(e.target.value)}
                placeholder="Escreva algumas palavras para Lumiana e Vicente..."
                className="border border-stone-200 rounded-xl p-3 bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-800 resize-none leading-relaxed"
              />
              <p className="text-[9px] text-stone-400 italic">Esta mensagem ficará guardada permanentemente no Mural de Recordações do casal.</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-start gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wedding-navy hover:bg-stone-900 text-white py-4.5 rounded-xl font-serif text-base font-semibold tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'A gravar...' : 'Confirmar Presença Oficial'}
                <Sparkles className="w-4 h-4 text-wedding-gold animate-pulse" />
              </button>
            </div>
          </motion.form>
        )}

        {isAttending === false && (
          <motion.form
            key="declining-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6 overflow-hidden text-left"
          >
            {/* Decline welcome card */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 border-l-4 border-l-wedding-burgundy">
              <p className="font-serif italic text-sm text-stone-700 leading-relaxed">
                "Ficamos tristes por não poder contar consigo neste dia tão especial. Ainda assim, agradecemos muito o carinho e desejamos recebê-lo(a) noutra ocasião em breve."
              </p>
            </div>

            {/* Message to Bride & Groom */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-wedding-navy">
                Gostaria de deixar votos ou uma mensagem aos noivos?
              </label>
              <textarea
                rows={4}
                value={rsvpMessage}
                onChange={(e) => setRsvpMessage(e.target.value)}
                placeholder="Deixe os seus votos de felicidade para Lumiana & Vicente..."
                className="border border-stone-200 rounded-xl p-3 bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-850 resize-none leading-relaxed"
              />
              <p className="text-[9px] text-stone-400 italic">As suas palavras serão guardadas com carinho na caixa de recordações dos noivos.</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-start gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#800020] hover:bg-[#500312] text-white py-4.5 rounded-xl font-serif text-base font-semibold tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'A enviar...' : 'Enviar Mensagem & Confirmar Ausência'}
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
