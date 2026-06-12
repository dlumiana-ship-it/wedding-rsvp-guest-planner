import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = digits.join('');
    if (pin.length !== 4) {
      setError('Por favor, preencha os 4 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digits: pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Autenticação falhou.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#C5A880] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-20 -right-20 w-64 h-64 bg-[#800020] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-20 w-64 h-64 bg-[#001B3D] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-100 p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <Heart className="w-8 h-8 text-wedding-burgundy mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-serif text-wedding-navy mb-2">Lumiana & Vicente</h1>
          <p className="text-stone-500 text-sm">Bem-vindo(a)! Para acessar o portal do casamento, insira os <strong>últimos 4 dígitos</strong> do seu número de celular.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                id={`digit-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-16 text-center text-2xl font-serif text-wedding-navy bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all shadow-inner"
              />
            ))}
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 px-4 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 4}
            className="w-full bg-wedding-navy hover:bg-[#00122E] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-semibold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4 text-wedding-gold" />
                Acessar Portal
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-stone-400">
          <p>Uso exclusivo para convidados e equipe do evento.</p>
        </div>
      </motion.div>
    </div>
  );
}
