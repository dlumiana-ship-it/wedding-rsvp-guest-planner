'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const WeddingApp = dynamic(() => import('../components/WeddingApp'), { ssr: false });
const AuthScreen = dynamic(() => import('../components/AuthScreen'), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; role: string; tableId?: number; checkIn?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wedding_user_session');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse user session', e);
        }
      }
      setLoading(false);
    }
  }, []);

  const handleLogin = (newUser: any) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('wedding_user_session', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('wedding_user_session');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wedding_user_session');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A880]/20 border-t-[#800020] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <WeddingApp user={user} onLogout={handleLogout} onLogin={handleLogin} />;
}
