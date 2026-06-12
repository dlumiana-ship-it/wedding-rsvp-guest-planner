import type {Metadata} from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css'; // Global styles

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lumiana & Vicente - Casamento',
  description: 'Site de Casamento e confirmação de presença de Lumiana e Vicente',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-[#FDFCFB] text-[#001B3D] min-h-screen selection:bg-[#800020]/10 selection:text-[#800020]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
