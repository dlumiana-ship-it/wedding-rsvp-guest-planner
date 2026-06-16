import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Loader2, Users, UserPlus } from 'lucide-react';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddGuestModal({ isOpen, onClose, onSuccess }: AddGuestModalProps) {
  const [activeTab, setActiveTab] = useState<'guest' | 'staff'>('guest');
  
  // Shared fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [side, setSide] = useState<'Bride' | 'Groom'>('Bride');

  // Guest-specific fields
  const [diet, setDiet] = useState('Nenhuma');
  const [dietDetails, setDietDetails] = useState('');
  const [music, setMusic] = useState('');
  const [accommodation, setAccommodation] = useState<'Yes' | 'No'>('No');
  const [accommodationDetails, setAccommodationDetails] = useState('');
  const [isCouple, setIsCouple] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  // Staff-specific fields
  const [role, setRole] = useState<'STAFF' | 'MC' | 'DJ' | 'PHOTOGRAPHER'>('STAFF');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setSide('Bride');
    setDiet('Nenhuma');
    setDietDetails('');
    setMusic('');
    setAccommodation('No');
    setAccommodationDetails('');
    setRole('STAFF');
    setError('');
    setIsCouple(false);
    setPartnerName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      side,
      role: activeTab === 'guest' ? 'GUEST' : role,
      status: activeTab === 'guest' ? 'PENDING' : 'CONFIRMED',
      vip: activeTab === 'staff', // Staff is marked as VIP by default to distinguish
      diet: activeTab === 'guest' ? diet : 'Nenhuma',
      dietDetails: activeTab === 'guest' ? dietDetails.trim() : null,
      musicRequest: activeTab === 'guest' ? music.trim() : null,
      needsAccommodation: activeTab === 'guest' ? (accommodation === 'Yes' ? 'Sim' : 'Não') : 'Não',
      accommodationDetails: activeTab === 'guest' ? accommodationDetails.trim() : null,
      companions: activeTab === 'guest' && isCouple && partnerName.trim()
        ? [{ name: partnerName.trim(), diet: 'Nenhuma' }]
        : undefined,
    };

    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Erro ao cadastrar.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-guest-panel">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative border border-stone-100 text-stone-900 flex flex-col max-h-[90vh]"
        >
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-4">
            <h3 className="font-serif text-2xl text-wedding-navy mb-1">Adicionar Cadastro</h3>
            <p className="text-stone-500 text-xs">Registe convidados ou membros da equipa no portal.</p>
          </div>

          {/* Clean Tabs */}
          <div className="flex border-b border-stone-100 mb-5 gap-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('guest');
                setError('');
              }}
              className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'guest'
                  ? 'border-wedding-navy text-wedding-navy'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Convidado
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                setError('');
              }}
              className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'border-wedding-navy text-wedding-navy'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Equipa / Staff
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 font-medium">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1" htmlFor="add-name">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                id="add-name"
                placeholder="Ex: João Cossa ou DJ Mário"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1" htmlFor="add-phone">
                Número de Celular *
              </label>
              <input
                type="tel"
                required
                id="add-phone"
                placeholder="Ex: +258840001234 (PIN será 1234)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
              />
            </div>

            {activeTab === 'guest' ? (
              <>
                {/* Opção de Casal */}
                <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCouple}
                      onChange={(e) => setIsCouple(e.target.checked)}
                      className="w-4 h-4 rounded text-wedding-navy border-stone-300 focus:ring-wedding-navy cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-700 select-none">
                      Enviar convite de casal
                    </span>
                  </label>

                  {isCouple && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1.5 pt-1 overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider" htmlFor="add-partner-name">
                        Nome do Cônjuge / Parceiro *
                      </label>
                      <input
                        type="text"
                        required={isCouple}
                        id="add-partner-name"
                        placeholder="Ex: Maria Machava"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Lado do Casal
                    </label>
                    <select
                      value={side}
                      onChange={(e) => setSide(e.target.value as any)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none text-stone-700 cursor-pointer"
                    >
                      <option value="Bride">Família Noiva</option>
                      <option value="Groom">Família Noivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Dieta
                    </label>
                    <select
                      value={diet}
                      onChange={(e) => setDiet(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none text-stone-700 cursor-pointer"
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
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1" htmlFor="diet-details">
                      Detalhes da Restrição Alimentar *
                    </label>
                    <input
                      type="text"
                      required
                      id="diet-details"
                      placeholder="Descreva intolerâncias ou alergias..."
                      value={dietDetails}
                      onChange={(e) => setDietDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Alojamento?
                    </label>
                    <select
                      value={accommodation}
                      onChange={(e) => setAccommodation(e.target.value as any)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none text-stone-700 cursor-pointer"
                    >
                      <option value="No">Não preciso</option>
                      <option value="Yes">Sim preciso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1" htmlFor="add-music">
                      Pedido de Música
                    </label>
                    <input
                      type="text"
                      id="add-music"
                      placeholder="Ex: Jerusalema - Master KG"
                      value={music}
                      onChange={(e) => setMusic(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                    />
                  </div>
                </div>

                {accommodation === 'Yes' && (
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1" htmlFor="accommodation-details">
                      Detalhes de Hospedagem *
                    </label>
                    <input
                      type="text"
                      required
                      id="accommodation-details"
                      placeholder="Ex: Quarto de casal para 2 noites..."
                      value={accommodationDetails}
                      onChange={(e) => setAccommodationDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-wedding-navy text-stone-850"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Cargo / Função do Staff *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none text-stone-700 cursor-pointer font-semibold"
                  >
                    <option value="STAFF">Cerimonial Geral / Staff</option>
                    <option value="MC">Mestre de Cerimónias (MC)</option>
                    <option value="DJ">DJ Oficial</option>
                    <option value="PHOTOGRAPHER">Fotógrafo Oficial</option>
                  </select>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-[10px] text-stone-600 space-y-1">
                  <span className="font-bold text-wedding-navy block">Instruções de Credencial</span>
                  <p>Membros da equipa usam os **últimos 4 dígitos** do celular para entrar.</p>
                  <p className="font-semibold mt-1">Exemplo:</p>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono">
                    <li>Número: {phone || '+258840001234'}</li>
                    <li>PIN / Código: <span className="font-bold text-wedding-burgundy">{phone ? phone.slice(-4) : '1234'}</span></li>
                  </ul>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-wedding-navy hover:bg-[#800020] disabled:bg-stone-300 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md mt-6 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {activeTab === 'guest' ? 'Cadastrar Convidado' : 'Cadastrar Membro da Equipa'}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
