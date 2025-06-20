import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages - set to your repository name
  base: '/Traininglog/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },server: {
    port: 3000,
    strictPort: false,
    hmr: true,
    cors: true,
    open: false,
    host: true
  },  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Training Log App',
        short_name: 'TrainingLog',
        description: 'A professional strength training logging application',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/Traininglog/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/Traininglog/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',            purpose: 'any'
          },
          {
            src: '/Traininglog/icons/icon-base.svg',
            sizes: '72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        start_url: '/Traininglog/',
        display: 'standalone',
        background_color: '#ffffff'
      },      workbox: {
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: new RegExp('^https://fonts.(?:googleapis|gstatic).com/(.*)'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
              }
            }
          }
        ]
      }
    })  ],
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    cors: true
  }
});
