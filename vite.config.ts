import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ForfettAIro - Vibecoded Gestione P.IVA Semplificata',
        short_name: 'ForfettAIro',
        description: 'App per gestire il regime forfettario italiano',
        theme_color: '#6366f1',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      }
    })
  ],
  build: {
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        // Don't preload heavy chunks
        return deps.filter(dep => !dep.includes('vendor-pdf') && !dep.includes('vendor-zip'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - must come first to avoid being pulled into other chunks
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // PDF library - isolated chunk, only loaded when needed
          if (id.includes('@react-pdf/renderer') || id.includes('node_modules/@react-pdf/')) {
            return 'vendor-pdf';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // ZIP handling
          if (id.includes('fflate')) {
            return 'vendor-zip';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
