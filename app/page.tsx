'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const WeddingApp = dynamic(() => import('../components/WeddingApp'), { ssr: false });
const AuthScreen = dynamic(() => import('../components/AuthScreen'), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; role: string; tableId?: number; checkIn?: boolean } | null>(null);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return <WeddingApp user={user} onLogout={() => setUser(null)} />;
}
