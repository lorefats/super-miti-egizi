import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const BASE = '/super-miti-egizi/';

export default defineConfig({
  base: BASE,
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    // PWA: il gioco si installa sul telefono ("Aggiungi a Home") e funziona anche senza internet.
    VitePWA({
      // quando pubblichiamo una versione nuova, il telefono la prende da solo alla prossima apertura
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Super Miti Egizi',
        short_name: 'Miti Egizi',
        description: 'Battaglia tra divinità egizie contro i bot. Si gioca anche senza internet.',
        lang: 'it',
        start_url: BASE,
        scope: BASE,
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#1F3A93',
        theme_color: '#14213D',
        icons: [
          { src: 'icone/icona-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone/icona-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // salva sul telefono tutto quello che serve per giocare offline (il gioco è un unico file grande)
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2,mp3,ogg,wav,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
