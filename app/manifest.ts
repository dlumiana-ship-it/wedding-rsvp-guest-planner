import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Casamento de Lumiana & Vicente',
    short_name: 'Lumiana & Vicente',
    description: 'Portal de confirmação de presença e organização do casamento de Lumiana e Vicente',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFCFB',
    theme_color: '#800020',
    icons: [
      {
        src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
