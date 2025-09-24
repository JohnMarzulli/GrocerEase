import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: { clientsClaim: true, skipWaiting: true },
        manifest: {
          name: 'GrocerEase',
          short_name: 'GrocerEase',
          start_url: '/',
          display: 'standalone',
          background_color: '#0B1D2D',
          theme_color: '#00A884',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: Number(env.VITE_PORT || 5173),
      open: true
    }
  };
});
