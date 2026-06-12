import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGuest: (guest: {
    name: string;
    phone: string;
    side: 'Bride' | 'Groom';
    diet: string;
    dietDetails: string;
    music: string;
    accommodation: 'Yes' | 'No';
    accommodationDetails: string;
  }) => void;
}

export default function AddGuestModal({ isOpen, onClose, onAddGuest }: AddGuestModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [side, setSide] = useState<'Bride' | 'Groom'>('Bride');
  const [diet, setDiet] = useState('Nenhuma');
  const [dietDetails, setDietDetails] = useState('');
  const [music, setMusic] = useState('');
  const [accommodation, setAccommodation] = useState<'Yes' | 'No'>('No');
  const [accommodationDetails, setAccommodationDetails] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setSide('Bride');
    setDiet('Nenhuma');
    setDietDetails('');
    setMusic('');
    setAccommodation('No');
    setAccommodationDetails('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddGuest({
      name: name.trim(),
      phone: phone.trim(),
      side,
      diet,
      dietDetails: dietDetails.trim(),
      music: music.trim(),
      accommodation,
      accommodationDetails: accommodationDetails.trim(),
    });
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="modal-add-guest-panel">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative border border-stone-100 text-stone-900"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-serif text-2xl text-wedding-navy mb-1">Adicionar Convidado</h3>
          <p className="text-stone-500 text-xs mb-4">Insira os dados do convidado diretamente.</p>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1" htmlFor="add-name">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                id="add-name"
                placeholder="Digite o nome do convidado..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1" htmlFor="add-phone">
                Número de Contato / Tel *
              </label>
              <input
                type="tel"
                required
                id="add-phone"
                placeholder="Digite o telefone de contato..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Lado do Evento
                </label>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-800"
                >
                  <option value="Bride">Família Noiva</option>
                  <option value="Groom">Família Noivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Restr. Alimentares
                </label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-[#001B3D]/10 text-xs rounded-lg cursor-pointer text-stone-800"
                >
                  <option value="Nenhuma">Nenhuma</option>
                  <option value="Vegetariano">Vegetariano</option>
                  <option value="Vegano">Vegano</option>
                  <option value="Sem Glúten">Sem glúten</option>
                  <option value="Outros">Outras</option>
                </select>
              </div>
            </div>

            {diet !== 'Nenhuma' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1" htmlFor="diet-details">
                  Detalhes da Dieta *
                </label>
                <input
                  type="text"
                  required
                  id="diet-details"
                  placeholder="Descreva intolerâncias ou restrições..."
                  value={dietDetails}
                  onChange={(e) => setDietDetails(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-800"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Alojamento?
                </label>
                <select
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-[#001B3D]/10 text-xs rounded-lg cursor-pointer text-stone-800"
                >
                  <option value="No">Não preciso</option>
                  <option value="Yes">Sim preciso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1" htmlFor="add-music">
                  Pedido de Música
                </label>
                <input
                  type="text"
                  id="add-music"
                  placeholder="Ex: Yesterday - The Beatles"
                  value={music}
                  onChange={(e) => setMusic(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-800"
                />
              </div>
            </div>

            {accommodation === 'Yes' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1" htmlFor="accommodation-details">
                  Detalhes do Alojamento *
                </label>
                <input
                  type="text"
                  required
                  id="accommodation-details"
                  placeholder="Ex: Quarto de casal, período..."
                  value={accommodationDetails}
                  onChange={(e) => setAccommodationDetails(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-wedding-burgundy text-stone-800"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-wedding-navy hover:bg-slate-800 text-white font-medium text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg mt-4 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Entrada RSVP
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
