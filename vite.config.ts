import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ખાતા કેન્દ્ર',
        short_name: 'પ્લેટ ડેપો',
        description: 'ખાતા કેન્દ્ર બિલિંગ અને ગોડાઉન સ્ટોક એપ્લિકેશન',
        theme_color: '#2563eb',
        background_color: '#f3f4f6',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Split heavy vendor libs into separate cached chunks
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-images': ['html-to-image', 'html2canvas'],
          'vendor-utils': ['date-fns', 'lodash'],
          'vendor-motion': ['motion'],
        }
      }
    }
  }
});
